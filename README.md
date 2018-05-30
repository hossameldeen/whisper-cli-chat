# Whisper CLI Chat
A cli chat app built on top of Ethereum's Whisper protocol

**Still work in progress, including the README**

## Purpose

Done as part of a hiring process, useful only to the extent that serves the hiring process.

This is a ___paid task___. Starting with this job, I'm trying to follow a standard of making hiring-process tasks for money, even if not useful for the examiner. My time shouldn't be given for free.

Needless to say: were I in dire need of the job, I may have accepted doing the task for free or may have not asked. Even in less difficult situations, I may accept the task being free.

## Installation instructions

**Prerequisites:** I'm assuming you're running a linux machine with `docker` installed. I also assume you're a bit comfortable with the commandline.

Still no main code written.

To run test code: from the project root, run: `bin/test.sh`

## Troubleshooting

#### bin/test.sh Permission denied

Run `chmod u+x bin/test.sh`

## Credits

Beside the libraries & tools used in code:

- [wait-on](https://github.com/jeffbski/wait-on): for how to check for file existence & port listening.
- [wait-until](https://www.npmjs.com/package/wait-until): for the idea of taking `interval` and `times` instead of `timeout`. Much simpler to implement.