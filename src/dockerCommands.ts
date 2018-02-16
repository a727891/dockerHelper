const { spawn } = require('child_process');
const path = require('path');
const yaml = require('node-yaml');
const IGNORE_SDTOUT = true;
const RETURN_AS_ARRAY = true;
/**
 * Important Docker Commands
 * docker ps
 * docker-compose [build | down | up | start| stop]
 * docker logs <id>
 * docker exec -it <id> /bin/bash
 * 
 * Get Container Id
 * docker inspect --format="{{.ID}}" <name>
 */
export class DockerCommands {

    constructor(private workdir: string) { }

    private asyncSpawn(command, args, ignore = false): Promise<string> {
        return new Promise((resolve, reject) => {
            process.stdout.write('\n')
            const cmd = spawn(command, args, { cwd: this.workdir });
            let result: string = '';
            cmd.stdout.on('data', (data) => {
                result += (data.toString());
                if (!ignore)
                    process.stdout.write(data);
            });
            cmd.stderr.on('data', (data) => {
                result += (data.toString());
                if (!ignore)
                    process.stderr.write(data);
            });
            cmd.on('close', (code) => {
                process.stdout.write('\n\n')
                resolve(result);
            });
        });
    }

    public async dockerStatus(): Promise<any> {
        return await this.asyncSpawn('docker', ['ps']);
    };

    public async getComposeServices(): Promise<string[]> {
        const config = await yaml.readSync(path.join(this.workdir, 'docker-compose.yml'));
        return Object.keys(config.services);
    }

    public async dockerComposePs(serviceName?): Promise<any> {
        const params = ['ps'];
        if (serviceName) {
            params.push(serviceName);
        }
        return await this.asyncSpawn('docker-compose', params);
    }
    
    public async dockerComposeBuild(): Promise<any> {
        return await this.asyncSpawn('docker-compose', ['build']);
    }

    public async dockerComposeUp(): Promise<any> {
        return await this.asyncSpawn('docker-compose', ['up', '-d'])
    }

    public async dockerComposeStart(serviceName): Promise<any> {
        return await this.asyncSpawn('docker-compose', ['start', serviceName])
    }

    public async dockerComposeStop(serviceName): Promise<any> {
        return await this.asyncSpawn('docker-compose', ['stop', serviceName])
    }

    public async dockerComposeDown(): Promise<any> {
        return await this.asyncSpawn('docker-compose', ['down']);
    }

    public async getContainerNameIdMap() {
        let nameIds = await this.asyncSpawn('docker', ['ps', '--format="{{.Names}}|{{.ID}}"'], IGNORE_SDTOUT);
        return nameIds.split('\n')
            .filter(e => e.length)
            .map(e => e.replace(new RegExp(/\"/, 'g'), ''))
            .map(e => {
                let a = e.split('|');
                return { name: a[0], id: a[1] }
            });
    }

    public async containerIdByName(containerName: string) {
        let id = await this.asyncSpawn('docker', ['inspect', '--format="{{.ID}}"', containerName], IGNORE_SDTOUT);
        return /[0-9a-f]+/g.exec(id)[0].substr(0, 6);
    }

    public async dockerlogs(containerId: string): Promise<any> {
        return await this.asyncSpawn('docker', ['logs', '--tail', '50', containerId]);
    }

    public dockerShell(containerId: string): any {
        return new Promise((resolve, reject) => {
            const cmd = spawn('docker', ['exec', '-it', containerId, '/bin/bash'], { cwd: this.workdir, stdio: 'inherit' });
            cmd.on('close', (code) => {
                resolve();
            });
        });
    }

}