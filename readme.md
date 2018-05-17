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
* Custom Commands
  * Make a json file called `dockerHelper.json` in the active directory
    * JSON Shape Array of Command Objects

    ```json
    [
      {
        "name":"<display name to user>",
        "cmd":"<command to execute (ie: docker-compose)>",
        "params":["<List of params","elements concat with spaces"]
      }
      
    ]
    ```

  ### Built using [InquirerJS](https://github.com/SBoudrias/Inquirer.js/) and [Pkg](https://github.com/zeit/pkg)