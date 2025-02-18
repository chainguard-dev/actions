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
	ConfluenceDisplay  string `env:"CONFLUENCE_DISPLAY,required"`
	ConfluenceURL      string `env:"CONFLUENCE_URL,required"`
	ConfluenceSpace    string `env:"CONFLUENCE_SPACE,required"`
	ConfluenceAncestor string `env:"CONFLUENCE_ANCESTOR,required"`
}{})

func main() {
	api, err := confluence.NewAPI(env.ConfluenceURL, env.ConfluenceUser, env.ConfluenceToken)
	if err != nil {
		log.Fatal(err)
	}

	for {
		resp, err := api.Search(confluence.SearchQuery{
			CQL:    fmt.Sprintf(`space="%s"`, env.ConfluenceSpace),
			Expand: []string{"content.history,content.ancestors"},
			Limit:  100,
		})
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
			/// Safe guard from deleting items not created by the intended user
			if result.Content.History.CreatedBy.DisplayName != env.ConfluenceDisplay {
				continue
			}

			// Now only delete if this page is in the lineage of the root ancestor
			for _, ancestor := range result.Content.Ancestors {
				if ancestor.ID == env.ConfluenceAncestor {
					id := result.Content.ID
					if _, err := api.DelContent(id); err != nil {
						log.Printf("unable to delete item %s: %v", id, err)
					} else {
						log.Printf("deleted item %s", id)
					}
					break
				}
			}
		}
		if resp.Size >= resp.TotalSize {
			break
		}
	}
}
