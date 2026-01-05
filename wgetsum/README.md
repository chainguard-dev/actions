# wgetsum

This action downloads a file using wget and verifies its checksum.

## Usage

```yaml
- uses: chainguard-dev/actions/wgetsum@main
  with:
    # URL is the URL to download.
    # Required.
    url: https://example.com/file.tar.gz
    # Output is the output path for the downloaded file.
    # If not set, wget will use its default behavior.
    # Optional.
    output: /tmp/file.tar.gz
    # Checksum is the expected checksum(s) of the file.
    # Multiple checksums can be provided (space or newline separated).
    # Checksums can optionally include an algorithm prefix (e.g., "sha256:abc123").
    # If no prefix is provided, sha256 is assumed.
    # Supported algorithms: sha256, sha512, sha1, md5.
    # Required.
    checksum: sha256:abc123...
    # Wget-flags are additional flags to pass to wget.
    # Optional.
    wget-flags: "-q"
```

## Scenarios

Single checksum (sha256 assumed):
```yaml
steps:
- uses: chainguard-dev/actions/wgetsum@main
  with:
    url: https://example.com/release.tar.gz
    checksum: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

With explicit algorithm prefix:
```yaml
steps:
- uses: chainguard-dev/actions/wgetsum@main
  with:
    url: https://example.com/release.tar.gz
    checksum: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

Multiple checksums (all must match):
```yaml
steps:
- uses: chainguard-dev/actions/wgetsum@main
  with:
    url: https://example.com/release.tar.gz
    checksum: |
      sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
      sha512:cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e
```
