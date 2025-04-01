# hugo2confluence

Convert and publish a Hugo site to Confluence

Note: this is highly experimental but might work for your needs.

## How to run

First set the required env vars:

```sh
# The email of user
export CONFLUENCE_USER="myemail@example.com"

# API Token created in Confluence UI
export CONFLUENCE_TOKEN="..."

# The API endpoint
export CONFLUENCE_URL="https://mysubdomain.atlassian.net/wiki/rest/api"

# The name of the Confluence space
export CONFLUENCE_SPACE="Myspace"

# The ID of the root ancestor page to create under (check ID by clicking "Edit")
export CONFLUENCE_ANCESTOR="12345678"

# The path to the directory containing the top-level Hugo _index.md file
export CONFLUENCE_ROOT="content/"

# If provided, add link to published Hugo version of the site
export CONFLUENCE_ORIG="https://mywiki.example.com/"

# If provided, add link to edit this page on GitHub etc.
export CONFLUENCE_EDIT="https://github.com/myorg/mywiki/edit/main/content/"
```

Then inside this directory, run the following:
```
go run .
```

## GitHub Action

This can be used as a GitHub Action inside your workflows:

```yaml
# Place in repo at .github/workflows/hugo2confluence.yml
name: hugo2confluence
on:
  push:
    branches:
      - main
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - name: Run hugo2confluence
        uses: chainguard-dev/actions/hugo2confluence@main
        env:
          CONFLUENCE_USER: "myemail@example.com"
          CONFLUENCE_TOKEN: "${{ secrets.CONFLUENCE_TOKEN }}"
          CONFLUENCE_URL: "https://mysubdomain.atlassian.net/wiki/rest/api"
          CONFLUENCE_SPACE: "Myspace"
          CONFLUENCE_ANCESTOR: "12345678"
          CONFLUENCE_ROOT: "content/"
          CONFLUENCE_LABEL: "my-unique-label"
          CONFLUENCE_ORIG: "https://mywiki.example.com/"
          CONFLUENCE_EDIT: "https://github.com/myorg/mywiki/edit/main/content/"
```

## Ultities

This section describes some utility programs in this folder
that may be needed in one-off situations.

Note: These may possibly lead to `429 Too Many Requests` errors depending on size of the Hugo site. Wait a bit and try again.

### Cleanup Utility

If you make a mistake running this tool, you can delete all the pages
created by it using the [cleanup](./cleanup/) tool:

```
go run cleanup/cleanup.go
```

### Label Utility

If you need to retroactively apply a label to all the pages,
you can use the [label](./label/) tool:

```
go run label/label.go
```

## TODO

THe following improvements can be made:

- Replace relative links with proper URL
- Stop using undocumented `markdownxhtmlconverter` endpoint
