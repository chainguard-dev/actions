package main

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/sethvargo/go-envconfig"
	confluence "github.com/virtomize/confluence-go-api"
)

var env = envconfig.MustProcess(context.Background(), &struct {
	ConfluenceUser     string `env:"CONFLUENCE_USER,required"`
	ConfluenceToken    string `env:"CONFLUENCE_TOKEN,required"`
	ConfluenceURL      string `env:"CONFLUENCE_URL,required"`
	ConfluenceSpace    string `env:"CONFLUENCE_SPACE,required"`
	ConfluenceAncestor string `env:"CONFLUENCE_ANCESTOR,required"`
	ConfluenceRoot     string `env:"CONFLUENCE_ROOT,required"`
	ConfluenceOrig     string `env:"CONFLUENCE_ORIG"`
	ConfluenceEdit     string `env:"CONFLUENCE_EDIT"`
}{})

func main() {
	log.Printf("Loading Hugo site from %s", env.ConfluenceRoot)
	children, err := getPages(env.ConfluenceRoot)
	if err != nil {
		log.Fatal(err)
	}
	rootPage := page{
		filePath: filepath.Join(env.ConfluenceRoot, indexFileName),
		children: children,
		parentID: env.ConfluenceAncestor,
	}

	api, err := confluence.NewAPI(env.ConfluenceURL, env.ConfluenceUser, env.ConfluenceToken)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Starting site sync to Confluence (url: %s space:%s ancestor:%s)",
		env.ConfluenceURL, env.ConfluenceSpace, env.ConfluenceAncestor)
	if err := syncPage(api, rootPage); err != nil {
		log.Fatal(err)
	}

	log.Println("Finished site sync to Confluence")
}

type page struct {
	// These fields are populated before any Confluence API calls
	filePath string
	children []page

	// These fields are populated later after interacting with Confluence
	parentID string
}

const indexFileName = "_index.md"

func getPages(rootDir string) ([]page, error) {
	pages := []page{}

	// Get all files in this directory (non-recursive)
	entries, err := os.ReadDir(rootDir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		fullPath := filepath.Join(rootDir, entry.Name())

		// For directory entries, add _index.md as a child,
		// then recursively get its children
		if entry.IsDir() {
			p := page{
				filePath: filepath.Join(fullPath, indexFileName),
			}
			children, err := getPages(fullPath)
			if err != nil {
				return nil, err
			}
			p.children = children
			pages = append(pages, p)
			continue
		}

		// Skip any non-markdown files and _index.md since we handle it differently
		if entry.Name() == indexFileName || filepath.Ext(fullPath) != ".md" {
			continue
		}

		// Add the markdown file as a child with no children
		pages = append(pages, page{
			filePath: fullPath,
		})
	}

	return pages, nil
}

func syncPage(api *confluence.API, p page) error {
	log.Printf("Syncing %s", p.filePath)

	// Generate the content
	content, err := contentFromFile(p.parentID, p.filePath)
	if err != nil {
		return err
	}

	// Check if the page already exists to determine correct version
	var existing *confluence.Content
	inc := 1
	modifiedTitle := ""
	for {
		// If there was a page found with the same name, but the ancestor did not match,
		// append a number to the end since Confluence pages must have unique names
		// underneath a root ancestor
		t := content.Title
		if inc > 1 {
			modifiedTitle = fmt.Sprintf("%s (%d)", content.Title, inc)
			t = modifiedTitle
		}

		resp, err := api.GetContent(confluence.ContentQuery{
			Expand:   []string{"version,ancestors"},
			SpaceKey: env.ConfluenceSpace,
			Title:    t,
		})
		if err != nil {
			return err
		}
		if len(resp.Results) == 0 {
			break
		}
		for _, result := range resp.Results {
			if result.Ancestors[len(result.Ancestors)-1].ID == p.parentID {
				existing = &result
				log.Printf("Found existing page \"%s\" (id:%s)", existing.Title, existing.ID)
				break
			}
		}
		if existing != nil {
			break
		}

		inc++
	}

	if modifiedTitle != "" {
		content.Title = modifiedTitle
	}

	var written *confluence.Content
	var writeErr error

	if existing != nil {
		content.ID = existing.ID
		content.Version.Number = existing.Version.Number + 1
		log.Printf("Updating page \"%s\" (parent:%s id:%s)", content.Title, p.parentID, content.ID)
		written, writeErr = api.UpdateContent(content)
	} else {
		log.Printf("Creating page \"%s\" (parent:%s)", content.Title, p.parentID)
		written, writeErr = api.CreateContent(content)
	}

	if writeErr != nil {
		return writeErr
	}

	log.Printf("Wrote page \"%s\" (parent:%s id:%s version:%d url:%s)",
		written.Title, p.parentID, written.ID, written.Version.Number, written.Links.WebUI)

	// Now recursively write the children
	// TODO: sync children pages asynchronously?
	for _, child := range p.children {
		child.parentID = written.ID
		if err := syncPage(api, child); err != nil {
			return err
		}
	}

	return nil
}

func contentFromFile(parentID string, path string) (*confluence.Content, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		if !os.IsNotExist(err) {
			return nil, err
		}
	}
	s := string(b)
	title := extractTitle(s, path)
	s = stripMeta(s)

	html := extraHTML(path)
	if s != "" {
		converted, err := remoteConvertMarkdown(s)
		if err != nil {
			return nil, err
		}
		html = fmt.Sprintf("%s\n%s", html, converted)
	}

	page := confluence.Content{
		Type:  "page",
		Title: title,
		Ancestors: []confluence.Ancestor{
			{
				ID: parentID,
			},
		},
		Body: confluence.Body{
			Storage: confluence.Storage{
				Value:          html,
				Representation: "storage",
			},
		},
		Version: &confluence.Version{
			Number: 1,
		},
		Space: &confluence.Space{
			Key: env.ConfluenceSpace,
		},
	}

	return &page, nil
}

// Prepend this HTML at the top of every page
func extraHTML(path string) string {
	extra := ""
	if env.ConfluenceOrig != "" {
		extra += fmt.Sprintf("<i>Mirrored from: <a href=\"%[1]s\">%[1]s</a></i><br>", origHugoURL(path))
	}
	if env.ConfluenceEdit != "" {
		extra += fmt.Sprintf("<i>Edit this page: <a href=\"%[1]s\">%[1]s</a></i><br>", origEditURL(path))
	}
	if extra != "" {
		extra += "<hr><br>"
	}
	return extra
}

// Return the URL to the original Hugo-based site
func origHugoURL(p string) string {
	return strings.TrimSuffix(strings.TrimSuffix(env.ConfluenceOrig, "/")+"/"+strings.TrimPrefix(strings.ReplaceAll(
		strings.ToLower(strings.TrimSuffix(strings.TrimSuffix(strings.TrimPrefix(
			p, env.ConfluenceRoot), indexFileName), ".md")), " ", "-"), "/"), "/") + "/"
}

// The URL to launch into editing this page (e.g. in GitHub UI)
func origEditURL(p string) string {
	return fmt.Sprintf("%s/%s",
		strings.TrimSuffix(env.ConfluenceEdit, "/"), strings.TrimPrefix(strings.TrimPrefix(p, env.ConfluenceRoot), "/"))
}

func stripMeta(s string) string {
	tmp := strings.SplitN(s, "---", 3)
	if len(tmp) < 3 {
		return s
	}
	return strings.TrimSpace(tmp[2])
}

func extractTitle(s string, path string) string {
	base := filepath.Base(path)

	// For _index.md, use the dirname
	if base == indexFileName {
		base = filepath.Base(filepath.Dir(path))
	}
	title := strings.TrimSuffix(base, ".md")

	// Attempt to extract real title from metadata if possible
	tmp := strings.Split(s, "title:")
	if len(tmp) >= 2 {
		title = strings.Trim(strings.TrimSpace(strings.Split(tmp[1], "\n")[0]), "\"")
	}

	return title
}

type convertMarkdownRequest struct {
	Wiki string `json:"wiki"`
}

// Hit an endpoint available on Confluence which converts Markdown
// to HTML that works well in Conlfuence
// Note: this feature is apparently only available in the legacy editor
func remoteConvertMarkdown(rawMarkdown string) (string, error) {
	payload := convertMarkdownRequest{
		Wiki: rawMarkdown,
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	buf := bytes.NewBuffer(b)
	url := strings.TrimSuffix(env.ConfluenceURL, "/api") + "/tinymce/1/markdownxhtmlconverter"
	req, err := http.NewRequest(http.MethodPost, url, buf)
	if err != nil {
		return "", err
	}
	req.Header.Add("Authorization", "Basic "+base64.StdEncoding.EncodeToString([]byte(env.ConfluenceUser+":"+env.ConfluenceToken)))
	req.Header.Add("Content-type", "application/json")
	client := http.DefaultClient
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	bodyString := string(bodyBytes)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%d: %s", resp.StatusCode, bodyString)
	}
	return bodyString, nil
}
