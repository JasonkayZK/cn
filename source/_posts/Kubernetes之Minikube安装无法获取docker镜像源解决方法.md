---
title: Kubernetes之Minikube安装与无法获取docker镜像源的解决方法
toc: true
date: 2019-09-24 17:50:25
cover: https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1569332601351&di=32771b48b62b361d39cd5958587d9fa0&imgtype=0&src=http%3A%2F%2Fimg2018.cnblogs.com%2Fblog%2F720430%2F201812%2F720430-20181226134529220-885595947.png
categories: 软件安装与配置
tags: [Kubernetes, Docker, 分布式]
description: 本篇解决了在国内安装Minikube时, 键入minikube start时, 无法通过谷歌官方k8s仓库获取镜像源的问题.
---



今天在安装部署Minikube的时候, 使用minikube start的时候, 由于k8s镜像源被墙无法拉取所需要的镜像，所以通过在阿里云下载镜像通过docker tag 改标签的方式来进行.

本篇文章主要内容:

-   Minikube的安装与配置
-   Minikube安装镜像源获取shell
-   Kubernetes简单配置
-   一些Kubernetes的工具
-   ......

<!--more-->

## 使用minikube在本机搭建kubernetes集群

### 零. 前言

Kubernetes（k8s）是自动化容器操作的开源平台，基于这个平台，你可以进行容器部署，资源调度和集群扩容等操作。如果你曾经用过[Docker](https://www.centos.bz/tag/docker/)部署容器，那么<font color="#ff0000">可以将Docker看成Kubernetes底层使用的组件，Kubernetes是Docker的上层封装，通过它可以很方便的进行Docker集群的管理。</font>

今天在安装部署Minikube的时候, 使用minikube start的时候, 由于k8s镜像源被墙无法拉取所需要的镜像，所以通过在阿里云下载镜像通过docker tag 改标签的方式来进行.



<br/>

---------------------



### 一. 安装Docker

Docker的安装这里不再赘述: 具体可参考官方文档或者我的博客:

-   [Docker官方文档](https://docs.docker.com/)
-   [记一次重装软件](/cn/2019/09/04/%E8%AE%B0%E4%B8%80%E6%AC%A1%E9%87%8D%E8%A3%85%E8%BD%AF%E4%BB%B6/)



<br/>

--------------------------



### 二. 安装Minikube

此为Minikube的官方文档: [Minikube的官方文档](https://minikube.sigs.k8s.io/docs/start/linux/)

#### 1. 安装

在Linux中可以通过安装:

```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
mv minikube-linux-amd64 minikube
chmod +x minikube
sudo mv minikube /usr/local/bin/minikube
```

<font color="#ff0000">下载完成之后仅有一个二进制执行文件!</font>

<br/>

#### 2. 安装验证

```bash
$  minikube version
minikube version: v1.4.0
commit: 7969c25a98a018b94ea87d949350f3271e9d64b6
```

<br/>

#### 3. 创建一个Minikube集群

```bash
$ sudo minikube start --vm-driver=none
[sudo] zk 的密码： 
😄  minikube v1.4.0 on Ubuntu 18.04
💡  Tip: Use 'minikube start -p <name>' to create a new cluster, or 'minikube delete' to delete this one.
🔄  Starting existing none VM for "minikube" ...
⌛  Waiting for the host to be provisioned ...
🐳  Preparing Kubernetes v1.16.0 on Docker 18.09.7 ...
    ▪ kubelet.resolv-conf=/run/systemd/resolve/resolv.conf
🔄  Relaunching Kubernetes using kubeadm ... 
🤹  Configuring local host environment ...
⌛  Waiting for: apiserver proxy etcd scheduler controller dns
🏄  Done! kubectl is now configured to use "minikube"
```

出现`Done`则说明创建成功!

这里使用了`–vm-driver=none`参数, <font color="#ff0000">因为minikube默认需要虚拟机来初始化kunernetes环境，但Linux是个例外，可以追加–vm-driver=none参数来使用自己的环境</font>

<br/>

<font color="#0000ff">对于首次创建, 将会读入kubernetes配置文件, 并根据配置文件, 去拉取相应的Docker镜像文件! 而这些镜像文件默认是通过k8s拉取, 而非DockerHub. 而由于k8s被墙, 导致国内无法正常拉取!</font>

<font color="#ff0000">除了科学上网的解决方法之外, 只能通过阿里云与DockerHub相结合的方法提取拉取镜像源, 并配置相应的版本!</font>

<br/>

#### 4. 使用脚本pull阿里云的k8s镜像并更改标签

我编写的shell脚本如下:

```bash
#!/bin/bash
# File name: install.sh

KUBE_VERSION=v1.16.0
KUBE_PAUSE_VERSION=3.1
ETCD_VERSION=3.3.15-0
DNS_VERSION=1.6.2
username=registry.cn-hangzhou.aliyuncs.com/google_containers

images=(
	kube-proxy:${KUBE_VERSION}
	kube-scheduler:${KUBE_VERSION}
	kube-controller-manager:${KUBE_VERSION}
	kube-apiserver:${KUBE_VERSION}
	pause:${KUBE_PAUSE_VERSION}
	etcd:${ETCD_VERSION}
	coredns:${DNS_VERSION}
)

for image in ${images[@]}
do
    docker pull ${username}/${image}
    docker tag ${username}/${image} k8s.gcr.io/${image}
    docker rmi ${username}/${image}
done


sudo docker pull dieudonnecc/storage-provisioner
docker tag dieudonnecc/storage-provisioner gcr.io/k8s-minikube/storage-provisioner:v1.8.1
docker rmi dieudonnecc/storage-provisioner

sudo docker pull greatbsky/k8s-dns-kube-dns-amd64
docker tag greatbsky/k8s-dns-kube-dns-amd64 k8s.gcr.io/k8s-dns-kube-dns-amd64:1.14.13
docker rmi greatbsky/k8s-dns-kube-dns-amd64


sudo docker pull ist0ne/k8s-dns-dnsmasq-nanny-amd64
docker tag ist0ne/k8s-dns-dnsmasq-nanny-amd64 k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64:1.14.13
docker rmi ist0ne/k8s-dns-dnsmasq-nanny-amd64


sudo docker pull ist0ne/k8s-dns-sidecar-amd64
docker tag ist0ne/k8s-dns-sidecar-amd64 k8s.gcr.io/k8s-dns-sidecar-amd64:1.14.13
docker rmi ist0ne/k8s-dns-sidecar-amd64

sudo docker pull lhcalibur/kube-addon-manager-amd64
docker tag lhcalibur/kube-addon-manager-amd64 k8s.gcr.io/kube-addon-manager:v9.0.2
docker rmi lhcalibur/kube-addon-manager-amd64

```

脚本内容相当简单: <font color="#ff0000">通过定义各个插件的版本, 分别在阿里云与DockerHub中先拉取对应的镜像, 然后修改tag, 最后将原tag镜像删除</font>

对于我使用的v1.16.0版本而言需要的镜像可以通过下面这条命令查看:

```bash
sudo grep 'image' -R /etc/kubernetes
```

输出如下:

```
/etc/kubernetes/addons/dashboard-dp.yaml:          image: kubernetesui/metrics-scraper:v1.0.1
/etc/kubernetes/addons/dashboard-dp.yaml:          image: kubernetesui/dashboard:v2.0.0-beta4
/etc/kubernetes/addons/storage-provisioner.yaml:    image: gcr.io/k8s-minikube/storage-provisioner:v1.8.1
/etc/kubernetes/addons/storage-provisioner.yaml:    imagePullPolicy: IfNotPresent
/etc/kubernetes/manifests/addon-manager.yaml.tmpl:    image: k8s.gcr.io/kube-addon-manager:v9.0.2
/etc/kubernetes/manifests/addon-manager.yaml.tmpl:    imagePullPolicy: IfNotPresent
/etc/kubernetes/manifests/etcd.yaml:    image: k8s.gcr.io/etcd:3.3.15-0
/etc/kubernetes/manifests/etcd.yaml:    imagePullPolicy: IfNotPresent
/etc/kubernetes/manifests/kube-scheduler.yaml:    image: k8s.gcr.io/kube-scheduler:v1.16.0
/etc/kubernetes/manifests/kube-scheduler.yaml:    imagePullPolicy: IfNotPresent
/etc/kubernetes/manifests/kube-controller-manager.yaml:    image: k8s.gcr.io/kube-controller-manager:v1.16.0
/etc/kubernetes/manifests/kube-controller-manager.yaml:    imagePullPolicy: IfNotPresent
/etc/kubernetes/manifests/kube-apiserver.yaml:    image: k8s.gcr.io/kube-apiserver:v1.16.0
/etc/kubernetes/manifests/kube-apiserver.yaml:    imagePullPolicy: IfNotPresent

```

<br/>

<font color="#ff0000">对于使用其他版本的同学, 也可以使用上述命令查询默认情况下需要的镜像名以及版本号, 然后在阿里云或者DockerHub搜索下载, 然后命名为上面配置中定义的tag即可!</font>

-   [阿里云kubernetes镜像搜索](https://dev.aliyun.com/search.html)
-   [DockerHub](https://hub.docker.com/)

安装完成之后再次使用: `sudo minikube start --vm-driver=none `即可安装成功!

<br/>

#### 5. 启动一个容器服务验证

```bash
# kube-nginx999 是要定义的容器名称 nginx:latest表明要用nginx镜像 --port=80表明容器对外暴露80端口
sudo kubectl run kube-nginx999 --image=nginx:latest --port=80

> deployment "kube-nginx999" created
```

查看状态:

```bash
sudo kubectl get pods

NAME                             READY     STATUS              RESTARTS   AGE
nginx999-55f47cb99-46nm8         1/1       containerCreating   0          38s
```

服务开启成功!

<br/>

---------------------



### 三. 安装Kubectl

<font color="#0000ff">要与Kubernetes进行交互, 还少不了使用kubectl CLI客户端!</font>

<font color="#ff0000">需要做的仅仅是下载, 并放置在路径中即可! 因为它仅仅就是一个二进制执行文件!</font>

在Linux中使用:

```bash
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
```

即可安装完成!

安装检验:

```bash
$ sudo kubectl version
Client Version: version.Info{Major:"1", Minor:"16", GitVersion:"v1.16.0", GitCommit:"2bd9643cee5b3b3a5ecbd3af49d09018f0773c77", GitTreeState:"clean", BuildDate:"2019-09-18T14:36:53Z", GoVersion:"go1.12.9", Compiler:"gc", Platform:"linux/amd64"}
Server Version: version.Info{Major:"1", Minor:"16", GitVersion:"v1.16.0", GitCommit:"2bd9643cee5b3b3a5ecbd3af49d09018f0773c77", GitTreeState:"clean", BuildDate:"2019-09-18T14:27:17Z", GoVersion:"go1.12.9", Compiler:"gc", Platform:"linux/amd64"}
```

安装完成!

<br/>

--------



### 四. Kubernetes的一些实用工具

#### 1. kubectl 命令自动补全

在k8s 1.3版本之前，设置kubectl命令自动补全是通过以下的方式：

```bash
source ./contrib/completions/bash/kubectl
```

<font color="#ff0000">但是在k8s 1.3版本，源码contrib目录中已经没有了completions目录，无法再使用以上方式添加自动补全功能;</font>

<font color="#ff0000">1.3版本中，kubectl添加了一个completions的命令， 该命令可用于自动补全, 通过下面的方法进行配置，便实现了kubectl的自动补全:</font>

```bash
source <(kubectl completion bash) 
```

**注意括号与箭头直接无分隔!!!**

在Linux中文件在:

```bash
# yum install -y bash-completion
# locate bash_completion
/usr/share/bash-completion/bash_completion
# source /usr/share/bash-completion/bash_completion
# source <(kubectl completion bash)
```

<br/>

#### 2. dashboard 管理后台

关于Dashboard可以在Github的官方Repo查看教程: [Kubernetes Dashboard](https://github.com/kubernetes/dashboard)



<br/>

-----------------



### 五. 总结

本篇文章主要讲述了如何不使用被墙的Google官方k8s镜像仓库安装Minikube, 并且安装kubectl, 最后介绍了两个使用kubernetes的工具: kubectl命令补全和doshboard.

今后博客还会更新Kubernetes相关内容, 尽请期待O(∩_∩)O!



<br/>

--------------------------



### 附录

文章参考:

-   [minikube安装](https://blog.csdn.net/qq_26819733/article/details/83591891)
-   [k8s部署失败ERROR ImagePull](https://blog.csdn.net/LoveyourselfJiuhao/article/details/90710984)
-   [使用minikube在本机搭建kubernetes集群](https://www.centos.bz/2018/01/使用minikube在本机搭建kubernetes集群/)
-   [使用脚本pull阿里云的k8s镜像并更改标签](https://www.cnblogs.com/lingshu/p/11282482.html)
-   [kubectl 命令自动补全](https://blog.csdn.net/wenwenxiong/article/details/53105287)
-   [Github的Kubernetes Dashboard官方仓库](https://github.com/kubernetes/dashboard)



