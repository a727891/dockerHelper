#Docker Helper
Interactive CLI Tool to perform common docker actions.

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


  ###Built using [https://github.com/SBoudrias/Inquirer.js/](InquirerJS) and [https://github.com/zeit/pkg](Pkg)