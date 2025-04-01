package main

import (
	"context"
	"fmt"
	"log"

	"github.com/sethvargo/go-envconfig"
	confluence "github.com/virtomize/confluence-go-api"
)

var env = envconfig.MustProcess(context.Background(), &struct {
	ConfluenceUser     string `env:"CONFLUENCE_USER,required"`
	ConfluenceToken    string `env:"CONFLUENCE_TOKEN,required"`
	ConfluenceURL      string `env:"CONFLUENCE_URL,required"`
	ConfluenceSpace    string `env:"CONFLUENCE_SPACE,required"`
	ConfluenceAncestor string `env:"CONFLUENCE_ANCESTOR,required"`
	ConfluenceLabel    string `env:"CONFLUENCE_LABEL,required"`
}{})

func main() {
	api, err := confluence.NewAPI(env.ConfluenceURL, env.ConfluenceUser, env.ConfluenceToken)
	if err != nil {
		log.Fatal(err)
	}

	next := ""
	query := confluence.SearchQuery{
		CQL:    fmt.Sprintf(`space=%q and label in (%q)`, env.ConfluenceSpace, env.ConfluenceLabel),
		Expand: []string{"content.history,content.ancestors"},
		Limit:  100,
	}

	for {
		resp, err := api.SearchWithNext(query, next)
		if err != nil {
			log.Fatal(err)
		}
		if resp == nil {
			break
		}
		for _, result := range resp.Results {
			if result.Content.History == nil || result.Content.Ancestors == nil {
				continue
			}

			// Now only delete if this page is in the lineage of the root ancestor
			for _, ancestor := range result.Content.Ancestors {
				if ancestor.ID == env.ConfluenceAncestor {
					id := result.Content.ID
					// Need to apply the label for cleanup purposes later
					log.Printf("Applying label \"%s\" to \"%s\" (id:%s)",
						env.ConfluenceLabel, result.Content.Title, id)
					labels := []confluence.Label{{Name: env.ConfluenceLabel}}
					if _, err := api.AddLabels(id, &labels); err != nil {
						log.Printf("unable to label item %s: %v", id, err)
					}
					break
				}
			}
		}
		next = resp.Links.Next
		if next == "" {
			break
		}
		log.Printf("Using next page: %s", next)
	}
}
