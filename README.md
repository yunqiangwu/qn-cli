### [q-cli](https://www.npmjs.com/package/@waynew/q-cli)

> a command line tool to operate qiniu cloud object strage

#### Usage

##### `upload`

> 上传文件

```
q-cli upload assets/** images/*.png --basePath q-cli/example
```

##### `login`

> 重新设置ak 和 sk

```
q-cli upload assets/** images/*.png
```

##### `buckets`

> bucket 相关操作

```
q-cli buckets list # 列出所有的buckets
```

##### `hosts`

> cdn hosts 相关

```
q-cli hosts [bucket] # 列出某个bucket中的所有映射域名 不输入bucket则会获取到所有的buckets然后选择
```

##### `refresh`

> 刷新资源cache

```
q-cli refresh
```
##### `objects`

> 存储对象相关

```
q-cli objects stats # 查看某个存储对象的数据
q-cli objects move # 移动存储对象
q-cli objects copy # 复制存储对象
q-cli objects delete # 删除存储对象
```
