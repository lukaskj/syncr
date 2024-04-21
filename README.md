# Syncr

Automation tool to help configure and orchestrate remotely via ssh commands using configuration files.

### Features:

- Execute cli commands;
- Execute bash scripts;
- Upload files.

## Instalation

```bash
$ npm install -g @lukaskj/syncr
# OR
$ pnpm install -g @lukaskj/syncr
```

## Running example

[![asciicast](https://asciinema.org/a/pEmRV5wr4eD4SCEe4CWe18dXI.svg)](https://asciinema.org/a/pEmRV5wr4eD4SCEe4CWe18dXI)

## Usage

```bash
$ syncr -s servers.yaml scenario1.yaml scenario2.yaml ...
# OR
$ syncr scenario1.yaml scenario2.yaml ...
```

```bash
# Help
$ syncr [options] <scenarios...>

Arguments:
  scenarios                 Scenarios to sync

Options:
  -s, --serversFile <file>  Servers file (default: "servers.yaml")
  -h, --hosts <hosts>       Run only in specified comma-separated hosts groups
  -d, --debug               Debug mode (default: false)
  -V, --version             output the version number
  --help                    display help for command
```

## Configuration

Configuration files can be created using YAML or JSON formats.<br />
Examples of configuration files in [examples folder](./examples/).

### Server configuration file

Contains groups of hosts connection information to connect to be referenced in scenarios files.<br />
The default servers config file is `servers.yaml` in the current directory, but also can be passed using the `-s` argument.

**Example:** [servers.yaml](./examples/servers.yaml) (json example [here](./examples/servers.json))

```yaml
---
aws: # Group name that can contain multiple hosts configuration
  - name: aws # Identification name
    host: domain.aws.com
    port: 2020
    username: root
    password: "123456"
    identityFile: "./aws-key.pem"

homelab:
  - name: raspberry-pi1
    host: 192.168.1.70
    port: 2020
    username: syncr
    password: "123456"

  - name: raspberry-pi2
    host: 192.168.1.71
    port: 2020
    username: syncr
    password: "123456"
```

## Scenarios

A scenario have a set of tasks that will be executed, in order, in the specified groups of hosts (see [server configuration](#server-configuration-file)).

### Scenarios configuration file

The scenario configuration file can contain one or multiple scenarios, defined as an array.

**Example with command, upload file and execute script:** [script-and-file.scenario.yaml](./examples/yaml/script-and-file.scenario.yml) (json example [here](./examples/json/script-and-file.scenario.json))

```yaml
---
- name: Execute script and upload file example
  hosts:
    - homelab
    - dev
  tasks:
    - name: Upload file
      uploadFile: ../scripts/file-to-upload.txt
      mode: 0o600
    - name: Execute script # optional
      script: ../scripts/example.sh
    - command: ls -lh
```

Note¹: `hosts` can contain the value `all` to execute in all enabled hosts from all groups in servers config file;<br>
Note²: The `uploadFile` and `script` file paths are relative to the scenario file.

---

### Types

```ts
Scenario: {
  name: string;
  hosts: string | string[];
  disabled?: boolean = false;
  concurrent?: boolean = true;
  tasks: (CommandTask | ScriptTask | UploadFileTask)[];
}[]
--
CommandTask: {
  name?: string;
  command: string;
  logOutput?: boolean = true;
  disabled?: boolean;
  workingDir?: string = ".";
}
--
ScriptTask: {
  name?: string;
  script: string;
  mode?: number = 0o755;
  logOutput?: boolean = true;
  disabled?: boolean;
  workingDir?: string = ".";
}
--
UploadFileTask: {
  name?: string;
  uploadFile: string;
  mode?: number = 0o755;
  logOutput?: boolean = true;
  disabled?: boolean;
  workingDir?: string = ".";
}
```
