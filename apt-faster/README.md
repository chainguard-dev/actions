# make apt go faster

This "apt-faster" action does several things to make 'apt-get install' work faster.

 * wrap 'apt-get install' with something that calls 'eatmydata'. eatmydata uses LD_PRELOAD to make sync and fsync a noop.

 * apt-get update - disable downloading of translations, app stream and 'command not found' data.

 * install - skip installation of doc files

 * install - disable man-db updating. this can be very slow, a minute or more.

 * install - disable 'recommends by default'. This will change the default ubuntu behavior and may break some things, but its better to list your dependencies that you know you are using rather than rely the "recommends" of apt to get them for you.

 * install - call dpkg with --force-unsafe-io By default dpkg will sync after every file written, which makes it extremely slow.  The above change to use eatmydata will improve that but might as well change the default behavior.
