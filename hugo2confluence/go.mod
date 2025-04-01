module github.com/chainguard-dev/actions/hugo2confluence

go 1.24.0

require (
	github.com/sethvargo/go-envconfig v1.1.1
	github.com/virtomize/confluence-go-api v1.5.0
)

require github.com/magefile/mage v1.15.0 // indirect

// This is needed in order to use ther SearchWithNext method
// See https://github.com/Virtomize/confluence-go-api/pull/69
replace github.com/virtomize/confluence-go-api => github.com/jdolitsky/confluence-go-api v0.0.0-20250401174407-48bdb8a37784
