#!/usr/bin/env node
import * as program from 'commander';
import upload from './scripts/upload';
import * as buckets from './scripts/buckets';
import * as hostnames from './scripts/hostnames';
import * as object from './scripts/object';
import * as login from './scripts/login';
import { refresh } from './scripts/refresh';

const packageJson = require('../package.json') as any;

program.version(packageJson.version);

program
  .command('upload')
  .description('upload files with glob string or file path')
  .option('-d, --dist <dist>', 'Base directory for all source files')
  .option('-p, --prefix <prefix>', 'setting your upload files prefix')
  .option('-b, --bucket <bucket>', 'setting your upload files bucket')
  .option('-u, --url <url>', 'refresh url')
  .action((options) => {
    upload({
      dist: options.dist,
      basePath: options.prefix,
      bucket: options.bucket,
    }).then(({ url }) => {
      return refresh({
        url: url || options.url,
      });
    })
  })

program
  .command('buckets')
  .description('show all buckets in your qiniu cdn')
  .action(() => {
    buckets.list();
  })

program
  .command('hosts')
  .description('show all host map to your bucket, bucket is option')
  .action((sub) => {
    // 在有子命令的时候 sub会是一个string，没有子命令，sub会是一个对象
    if (typeof sub === 'string') {
      hostnames.fetchHosts(sub);
    } else {
      hostnames.fetchHosts();
    }
  })

program
  .command('refresh')
  .description('qiniu storage cache refresh')
  .option('-u, --url <url>', 'refresh url')
  .action((options) => {
    refresh({
      url: options.url,
    });
  })

const objects = program
  .command('objects [operation]')
  .description('qiniu storage object operations')
  .action(function(operation) {
    switch(operation) {
      case 'stats':
        return object.stats();
      case 'move':
        return object.move();
      case 'copy':
        return object.copy();
      case 'delete':
        return object.del();
      default:
        objects
          .help(origin => {
            const operatons = {
              stats: 'Query object stats',
              move: 'Move object from origin bucket and key to target bucket and key',
              copy: 'Copy object from origin bucket and key to target bucket and key',
              delete: 'Delete object with target and key',
            } as { [k: string]: string };
            origin += '\n  Operations:\n\n';
            Object.keys(operatons).forEach((k: string) => {
              origin += `    ${k}   ${operatons[k]} \n\n`
            })
            return origin;
          })
    }
  })

program
  .command('login')
  .description('login qiniu (reset qiniu access token and secrect token)')
  .option('-a, --ak <ak>', 'setting ak')
  .option('-s, --sk <sk>', 'setting sk')
  .action((option) => {
    login.reset({
      ak: option.ak,
      sk: option.sk,
    });
  })

const result = program.parse(process.argv);

if (result.args.length == 0) {
  program.help();
} else if (result.args.filter(i => typeof i ==='string').length === result.args.length) {
  program.help();
}
