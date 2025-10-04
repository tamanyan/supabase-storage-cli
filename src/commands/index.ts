import type { CommandModule } from 'yargs'
import * as bucket from './bucket'
import * as file from './file'
import * as url from './url'

export const commands: CommandModule[] = [bucket, file, url]
