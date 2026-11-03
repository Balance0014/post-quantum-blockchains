# 抗量子加密研究（Post-Quantum Crypto Research）

研究抗量子方案在加密网络中的部署、算法差异，以及比特币迁移时持有人需要面对的问题。

| 研究方向 | 阅读入口 |
| --- | --- |
| 项目部署 | [17 个项目对比](docs/projects.md)：已经部署什么、用在哪里、有什么限制。 |
| 算法对比 | [算法地图](#项目与算法地图)与[签名尺寸](docs/signature-sizes.md)：用途、参数和编码。 |
| 比特币迁移 | [r8 的 BRUTER 框架与未迁移资金](research/bitcoin-migration/r8-bruter/README.zh-CN.md)：中英文图解、来源和可复算的容量算例。 |

项目与算法数据仍为 2026 年 10 月 23 日快照。比特币专题采用 10 月 31 日核对的来源版本，GitHub 版整理于 11 月 3 日，各自保留日期和范围。

[English](README.md) · 整理维护:Balance Zhao([@balance0014](https://x.com/balance0014))

截至 2026 年 10 月 23 日:

- **17 个里有 12 个**,日常交易默认就走抗量子方案。
- **4 个**只把它做成可选账户、可选锁或演示:Nexus、Starknet、Algorand、Nervos CKB。
- **1 个**还只有测试网:QANplatform。

这些数据来自我在 [X](https://x.com/balance0014) 上发的两张图:一张是各项目的抗量子部署时间线,一张是算法分布和签名尺寸对比。数据截至发图当天,10 月 28 日开源前又抽查了几项([抽查记录](docs/release-review.md))。图不会跟着更新,这不是实时数据,也不是安全排名。

## 项目与算法地图

![各项目抗量子部署时间线(截至 2026 年 10 月 23 日)](charts/deployment-timeline-2026-10-23.png)

![按密码学用途分组的算法分布,以及公钥和签名尺寸对比](charts/algorithm-map-2026-10-23.png)

## 容易看错的几处

- **Mochimo**:记的是 2026 年 10 月转成 PoS 之后的状态,之前是 PoW。
- **QANplatform**:QANX 代币在交易,但它的抗量子链还只是测试网。
- **Starknet**:2021 年那个节点是 L2 主网 Alpha。转独立 L1 的投票只同意继续研究,没有批准离开以太坊。
- **Raqcoin**:2018 年是前身 ABCMint 上线,不是开始用 UOV 的年份。ABCMint 原来的 Rainbow 参数已被公开攻破;Raqcoin 的指南里默认的仍是一套 Rainbow 配置(274),本资料库没有分析过这套配置。
- **Quantus 和 qtcchain**:代币符号都是 QTC,但是两条不同的链,请按项目 ID 和出处区分。

## 这份数据能说明什么

- 可选的抗量子锁,只保护你转进去的那部分币。老账户、共识密钥、跨链桥都不会因此改变。
- 尺寸表是特定参数下的公钥和签名字节数,不是整笔交易大小、手续费,也不是安全排名;表里的 UOV 数值不是 Raqcoin 交易的实测。
- 出处是项目自己文档的,请理解为「项目方这么说」,不是审计结论。81 条出处里有 19 条固定到了具体代码版本;项目网页可能改动或下线。
- 这是挑选过的对比,不是所有抗量子项目的全集:收录的是原来两张图上的项目,加上读者问得多的;最低证据门槛见[方法说明](docs/methodology.md)(英文)。

## 比特币迁移与治理

新的花费规则可用之后，仍受旧规则控制的资金怎么办？[比特币专题](research/bitcoin-migration/r8-bruter/README.zh-CN.md)解释 r8 的框架、网络激活与持有人迁移的区别，以及未迁移资金涉及的权利问题。四张图提供内容对应的[中文](research/bitcoin-migration/r8-bruter/README.zh-CN.md)和[英文](research/bitcoin-migration/r8-bruter/README.md)版本，附高清 PNG、可编辑 SVG 与来源。

r8 的时间设定保留情景归属，历史容量算例单独说明。两者都不提供固定的量子破解日期或价格目标。

## 怎么用、怎么纠错

可以下载[项目表 CSV](data/projects.csv) 或 [JSON](data/projects.json) 自己分析。引用时请注明数据日期并链回本仓库,改过的请说明改了什么。数据、图片和文字用 CC BY 4.0,脚本用 MIT,详见 [LICENSE](LICENSE)。

发现错误或想补项目,请[提 issue](https://github.com/Balance0014/post-quantum-crypto-map/issues/new/choose),写清是哪一条、原始出处、对应的网络和版本,我核实后更新。
