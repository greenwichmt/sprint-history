1.保存当前design的同时，由templateId自动跳转到designId，执行保存
2.patch design
design   -name 1451 -neighbor 1519
template -name 1505 -neighbor 1517
3.save as template
template -name 1517 -neighbor 1519

所以得出结论save的时候拿的是template的数据，正确方法是拿patch后最新的design数据
修改后↓
template -name 1519 -neighbor 1519