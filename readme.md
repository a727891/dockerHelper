# Docker Helper
Interactive CLI Tool to perform common docker actions.

Run binaries from the docker-compose folder.

Supports menu selection for:
* docker
  * ps
  * logs {container}
  * exec -it {container} /bin/bash
* docker-compose
  * ps {container?}
  * build
  * up -d
  * down
  * start / stop


  ### Built using [InquirerJS](https://github.com/SBoudrias/Inquirer.js/) and [Pkg](https://github.com/zeit/pkg)