import * as inquirer from 'inquirer';
import { DockerCommands } from './dockerCommands';
import * as fs from 'fs';
const packagejson = require('../package.json');
const chalk = require('chalk');

const PROJECT_NAME = 'gcoplatform';

export interface iCustomCommand {
  name: string;
  cmd: string;
  params: string[]
}


class dockerHelper {

  private BACK_BTN = {
    name: chalk.red('<< Back'),
    value: 'BACK',
    short: 'Main Menu'
  }

  private dockerCommands: DockerCommands;
  private composePresent = false;
  private dockerfilePresent = false;
  private customfilePresent = false;
  private customCommands: iCustomCommand[] = [];

  constructor(workDirPath) {
    this.detectDockerFiles(workDirPath);
    this.detectCustomFile(workDirPath);
    this.dockerCommands = new DockerCommands(workDirPath);
    this.startUp();
  }

  detectDockerFiles(path) {
    const cFiles = fs.readdirSync(path).filter((f) => f.endsWith('yml') || f.endsWith('yaml'));
    if (cFiles.length >= 1) {
      this.composePresent = true;
    }
    const dFiles = fs.readdirSync(path).filter((f) => f.startsWith('Dockerfile'));
    if (dFiles.length >= 1) {
      this.dockerfilePresent = true;
    }

  }
  detectCustomFile(path) {
    if (fs.existsSync(`${path}/dockerHelper.json`)) {
      this.customCommands = JSON.parse(fs.readFileSync(`${path}/dockerHelper.json`, 'utf-8'));
      this.customfilePresent = true;
    }
  }

  async startUp() {
    const status = await this.dockerCommands.dockerStatus();
    if (status === null) {
      console.log("\n!!! DOCKER DAEMON IS NOT AVAILABLE !!!\n");
      process.exit(0);
    }
    this.mainMenu().catch(errors=>{
      console.log(errors);
    });
  }

  async mainMenu() {
    const QUIT_BTN = {
      name: chalk.red('Quit'),
      value: 'QUIT',
      short: 'Good Bye'
    };
    const DOCKER_MENU_BTN = {
      name: 'Docker / Container (Status, Logs, Shell)',
      value: 'DOCKER_MENU',
      short: 'Docker / Container'
    }
    const DOCKER_COMPOSE_MENU_BTN = {
      name: 'Docker-Compose (Build and Run entire project)',
      value: 'DOCKER_COMPOSE_MENU',
      short: 'Compose',
      disabled: (this.composePresent ? false : chalk.yellow('No docker-compose.yml detected'))
    }
    const CUSTOM_MENU_BTN = {
      name: 'Custom Commands',
      value: 'CUSTOM_MENU',
      short: 'Custom',
      disabled: (this.customfilePresent ? false : chalk.yellow('No dockerHelper.json detected'))
    }

    const DOCKER_FILE_BTN = {
      name: 'Dockerfile commands',
      value: 'DOCKER_FILE_MENU',
      short: 'Dockerfile',
      disabled: 'coming soon'
    }

    const MAIN_MENU = {
      type: 'list',
      name: 'menu',
      message: `--- Docker Helper (v${packagejson.version})---`,
      choices: [
        DOCKER_MENU_BTN,
        DOCKER_COMPOSE_MENU_BTN,
        CUSTOM_MENU_BTN,
        // DOCKER_FILE_BTN,
        new inquirer.Separator(),
        QUIT_BTN
      ]
    }
    const { menu } = await inquirer.prompt(MAIN_MENU);
    switch (menu) {
      case QUIT_BTN.value:
        return process.exit(0);
      case DOCKER_MENU_BTN.value:
        return this.dockerMenu();
      case DOCKER_FILE_BTN.value:
        return this.mainMenu();
      case DOCKER_COMPOSE_MENU_BTN.value:
        await this.dockerCommands.dockerComposePs();
        return this.dockerComposeMenu();
      case CUSTOM_MENU_BTN.value:
        return this.customMenu();
    }
  }

  async customMenu(): Promise<any> {

    const CUSTOM_MENU = {
      type: 'list',
      name: 'answer',
      message: 'Custom Command Menu',
      choices: [
        ...(this.customCommands.map((elem, index): inquirer.objects.ChoiceOption => {
          return {
            name: `${elem.name}`,
            value: index.toString()
          }
        })),
        new inquirer.Separator(),
        this.BACK_BTN
      ]
    };
    const { answer } = await inquirer.prompt(CUSTOM_MENU);
    switch (answer) {
      case this.BACK_BTN.value:
        return this.mainMenu();
      default:
        await this.dockerCommands.customCommand(this.customCommands[parseInt(answer)]);
        return this.customMenu();
    }

  }

  async dockerMenu(): Promise<any> {
    const runningContainers = await this.dockerCommands.getContainerNameIdMap();
    const DOCKER_PS_BTN = {
      name: `${chalk.green('Status')} \`docker ps\``,
      value: 'ps',
      short: '`docker ps`'
    }
    const DOCKER_MENU = {
      type: 'list',
      name: 'answer',
      message: 'Docker Commands and Container Selection',
      choices: [
        DOCKER_PS_BTN,
        new inquirer.Separator(),
        ...(runningContainers.map((elem, index): inquirer.objects.ChoiceOption => {
          return {
            name: `${elem.name} (${elem.id})`,
            value: index.toString()
          }
        })),
        new inquirer.Separator(),
        this.BACK_BTN
      ]
    };
    const { answer } = await inquirer.prompt(DOCKER_MENU);
    switch (answer) {
      case this.BACK_BTN.value:
        return this.mainMenu();
      case DOCKER_PS_BTN.value:
        await this.dockerCommands.dockerStatus();
        return this.dockerMenu();
      default:
        return this.containerMenu(runningContainers[parseInt(answer)]);
    }

  }

  async containerMenu(container) {
    const CONTAINER_LOGS_BTN = {
      name: `${chalk.green('Logs')} \`docker logs ${container.id}\``,
      value: 'LOGS',
      short: '`docker logs`'
    }
    const CONTAINER_SHELL_BTN = {
      name: `Shell 'docker exec -it ${container.id} /bin/bash'`,
      value: 'SHELL',
      short: '`docker exec ...` Type `exit` to leave the shell'
    }
    const CONTAINER_MENU = {
      type: 'list',
      name: 'menu',
      message: `Manage Container ${chalk.magenta(container.name)}`,
      choices: [
        CONTAINER_LOGS_BTN,
        CONTAINER_SHELL_BTN,
        new inquirer.Separator(),
        this.BACK_BTN
      ]
    };
    const { menu } = await inquirer.prompt(CONTAINER_MENU);
    switch (menu) {
      case this.BACK_BTN.value:
        return this.dockerMenu();
      case CONTAINER_LOGS_BTN.value:
        await this.dockerCommands.dockerlogs(container.id);
        return this.containerMenu(container)
      case CONTAINER_SHELL_BTN.value:
        await this.dockerCommands.dockerShell(container.id);
        return this.containerMenu(container)
      default:
        console.log(`Unknown selection!!`);
        return this.mainMenu();
    }
  }

  async dockerComposeMenu() {
    const services = await this.dockerCommands.getComposeServices();
    const DC_PS_BTN = {
      name: `${chalk.green('Status')} \`docker-compose ps\``,
      value: 'PS',
      short: '`docker-compose ps`'
    }
    const DC_BUILD_BTN = {
      name: 'Build All Services `docker-compose build`',
      value: 'BUILD',
      short: '`docker-compose build`'
    }
    const DC_UP_BTN = {
      name: `${chalk.green('Run')} Services \`docker-compose up -d\``,
      value: 'UP',
      short: '`docker-compose up -d`'
    }
    const DC_DOWN_BTN = {
      name: `${chalk.red('Stop')} Services \`docker-compose down\``,
      value: 'DOWN',
      short: '`docker-compose down`'
    }

    const DC_Logs_BTN = {
      name: `Logs \`docker-compose logs\``,
      value: 'Logs',
      short: '`docker-compose logs`'
    }

    const DOCKER_COMPOSE_MENU: inquirer.Question = {
      type: 'list',
      name: 'serviceName',
      message: 'Docker-Compose Commands and Service Selection',
      paginated: true,
      pageSize: 5,
      choices: [
        DC_PS_BTN,
        DC_Logs_BTN,
        DC_UP_BTN,
        DC_DOWN_BTN,
        DC_BUILD_BTN,
        new inquirer.Separator(),
        ...services,
        new inquirer.Separator(),
        this.BACK_BTN
      ]
    }

    const { serviceName } = await inquirer.prompt(DOCKER_COMPOSE_MENU);
    switch (serviceName) {
      case this.BACK_BTN.value:
        return this.mainMenu();
      case DC_Logs_BTN.value:
        await this.dockerCommands.dockerComposeLogs();
        return this.dockerComposeMenu();
      case DC_BUILD_BTN.value:
        await this.dockerCommands.dockerComposeBuild();
        return this.dockerComposeMenu();
      case DC_UP_BTN.value:
        await this.dockerCommands.dockerComposeUp();
        return this.dockerComposeMenu();
      case DC_DOWN_BTN.value:
        await this.dockerCommands.dockerComposeDown();
        return this.dockerComposeMenu();
      case DC_PS_BTN.value:
        await this.dockerCommands.dockerComposePs();
        return this.dockerComposeMenu();
      default:
        return this.dockerComposeServiceMenu(serviceName);
    }
  }

  async dockerComposeServiceMenu(serviceName: string) {
    const DC_PS_BTN = {
      name: chalk.green('Status') + ` \`docker-compose ps ${serviceName}\``,
      value: 'PS',
      short: '`docker-compose ps ...`'
    }
    const DC_START_BTN = {
      name: `Start ${chalk.underline(serviceName)} \`docker-compose start ${serviceName}\``,
      value: 'START',
      short: '`docker-compose start ...`'
    }
    const DC_STOP_BTN = {
      name: `${chalk.red('STOP')} ${chalk.underline(serviceName)} \`docker-compose stop ${serviceName}\``,
      value: 'STOP',
      short: '`docker-compose stop ...`'
    }
    const DC_BUILD_BTN = {
      name: `${chalk.yellow('Build')} ${chalk.underline(serviceName)} \`docker-compose build ${serviceName}\``,
      value: 'Build',
      short: '`docker-compose build ...`'
    }

    const DC_Logs_BTN = {
      name: `'Logs' \`docker-compose logs -f ${serviceName}\``,
      value: 'Logs',
      short: `\`docker-compose logs ${serviceName}\``
    }

    const DOCKER_COMPOSE_MENU: inquirer.Question = {
      type: 'list',
      name: 'menu',
      message: `Manage Docker-Compose Service ${chalk.magenta(serviceName)}`,
      paginated: true,
      pageSize: 5,
      choices: [
        DC_PS_BTN,
        DC_Logs_BTN,
        DC_START_BTN,
        DC_STOP_BTN,
        DC_BUILD_BTN,
        new inquirer.Separator(),
        this.BACK_BTN
      ]
    }
    const { menu } = await inquirer.prompt(DOCKER_COMPOSE_MENU);
    switch (menu) {
      case this.BACK_BTN.value:
        return this.dockerComposeMenu();
      case DC_Logs_BTN.value:
        await this.dockerCommands.dockerComposeLogs(serviceName);
        return this.dockerComposeServiceMenu(serviceName);
      case DC_PS_BTN.value:
        await this.dockerCommands.dockerComposePs(serviceName);
        return this.dockerComposeServiceMenu(serviceName);
      case DC_START_BTN.value:
        await this.dockerCommands.dockerComposeStart(serviceName);
        return this.dockerComposeServiceMenu(serviceName);
      case DC_STOP_BTN.value:
        await this.dockerCommands.dockerComposeStop(serviceName);
        return this.dockerComposeServiceMenu(serviceName);
      case DC_BUILD_BTN.value:
        await this.dockerCommands.dockerComposeBuildService(serviceName);
        return this.dockerComposeServiceMenu(serviceName);
      default:
        console.log('Unknown selection!!');
        return this.dockerComposeMenu();
    }
  }

}


//Run the program!
new dockerHelper(process.cwd());