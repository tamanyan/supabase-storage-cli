import yargs from 'yargs'
import { config } from 'dotenv'
import { commands } from '../src'
import { bgBlue, bold, red } from 'picocolors'

config()

const run = yargs(process.argv.slice(2))
run.usage(
  bgBlue(
    `Welcome to the CLI application powered by ${bold(red('supabase-storage-cli'))}!'
    See more on https://github.com/tamanyan/supabase-storage-cli`,
  ),
)
for (const command of commands) {
  run.command(command)
}

run.demandCommand(1, 'You need at least one command before moving on').help().argv
