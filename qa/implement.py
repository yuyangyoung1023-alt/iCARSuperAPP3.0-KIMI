from pathlib import Path
import json,subprocess,hashlib
p=Path(__file__).resolve().parents[1]
# Record a precise baseline before editing runtime files.
base={x:hashlib.sha256((p/x).read_bytes()).hexdigest() for x in ['index.html','assets/home-motion.js','assets/home-motion.css','README.md','sw.js','manifest.webmanifest']}
(p/'qa/baseline-hashes.json').write_text(json.dumps(base,indent=2))
subprocess.run(['git','remote','remove','origin'],cwd=p,check=True)
s=(p/'index.html').read_text().replace('icarClawV2','icarClawV3').replace('<title>','<title>V3.0 · ',1)
s=s.replace('</head>','<link rel="stylesheet" href="./assets/v3.css"></head>')
s=s.replace('</body>','<script src="./assets/scenes-v3.js"></script><script src="./assets/v3.js"></script></body>')
(p/'index.html').write_text(s)
s=(p/'assets/home-motion.js').read_text();s=s[:s.index('  const hero =')]+"  home.prepend(room); home.classList.add('motionHome'); home.dataset.room='skills';\n})();\n";(p/'assets/home-motion.js').write_text(s)
# Stable scene ids are distinct from display categories and legacy voice domains.
rows='''smart|find-car|寻车场景（AI停车位置记忆）|离车记位置，回来轻松找到车|出行助手|精准导航|route
smart|parking-pay|停车缴费（停车扫码支付）|识别停车码，确认后完成缴费|生活服务|停车缴费|parking
smart|sentry-plus|哨兵PLUS|车辆停放时，记录异常与关键片段|全局语音|Claw 全能助手|shield
smart|app-master|智能应用大师|用自然语言协同应用完成任务|全局语音|Claw 全能助手|sparkles
smart|scene-master|智能场景大师|说出习惯，让日常自动发生|全局语音|Claw 全能助手|sparkles
smart|child-left|儿童遗留守护|离车后关爱每一位小乘客|全局语音|Claw 全能助手|shield
smart|visibility|视野恢复|雨雾来临时，恢复清晰视野|车辆控制|感受类控车|wind
smart|fatigue|疲劳驾驶关怀|识别疲劳，适时提醒休息|全局语音|Claw 全能助手|shield
smart|child-risk|儿童危险行为提醒|关注儿童乘车行为，及时提醒|全局语音|Claw 全能助手|user
smart|pet-left|宠物遗留守护|离车后，继续关心毛孩子|全局语音|Claw 全能助手|shield
smart|item-left|遗留物品提醒|随身物品，离车前再提醒一次|全局语音|Claw 全能助手|search
smart|commute|通勤模式|熟悉的时间，熟悉的舒适出发|出行助手|常用地直达|route
smart|welcome|记忆迎宾与恢复|上车时，恢复熟悉的座舱偏好|全局语音|Claw 全能助手|memory
smart|content|主动内容推荐|为每段旅程准备合适的内容|媒资娱乐|新闻播报|media
smart|scenic|沿途风景讲解|路过山海，也听见沿途故事|出行助手|目的地发现与精准到达|route
fun|fortune|运势与占卜|用轻松的趣味测试打开旅程|iCAR趣玩|测测|zodiac
fun|chat|情绪陪聊|倾听此刻心情，陪你聊一会儿|全局语音|Claw 全能助手|user
fun|encyclopedia|百科问答|一路好奇，一起找答案|全局语音|Claw 全能助手|book
fun|english|英语对话|把路上的时间变成口语练习|全局语音|Claw 全能助手|mic
fun|games|语音互动游戏|开口就能参与的车内小游戏|iCAR趣玩|海龟汤|sparkles
fun|sound|音效与声场调节|找到适合每位乘客的听感|车辆控制|多任务控车|sliders
fun|persona|自定义人设|选择更合拍的声音与表达|全局语音|Claw 全能助手|user
fun|visual-chat|沿途识物与看图聊天|看见新鲜事，随口聊一聊|iCAR趣玩|沿途识物|search
car|ma-car|一句话，搞定复杂车控（MA）|一次表达，安排舒适座舱|车辆控制|多任务控车|car
car|nap|惬意午休|为一段小憩准备舒适环境|iCAR趣玩|惬意午休|car
car|manual|智能车书|随时解答用车知识|车辆知识问答|车辆知识问答|book
car|repair|故障维修|理解异常，找到下一步处理方式|车辆知识问答|故障灯问询|diagnostic
car|outside-park|车外语音泊车|车外说出需求，了解泊车流程|全局语音|Claw 全能助手|parking
car|outside-control|车外基础车控|车外开口，操作基础车辆功能|车辆控制|多任务控车|car
travel|ma-travel|一句话，安排复杂行程（MA）|目的地、途经点与偏好，一起说|出行助手|多日行程规划|route
travel|memory-nav|记忆导航|常去的地方，更自然地到达|出行助手|常用地直达|memory
travel|precise-nav|精准导航|找到目的地真正需要到达的入口|出行助手|目的地发现与精准到达|route
travel|guide-route|攻略转路线|把旅行想法整理成路线|出行助手|多日行程规划|route
travel|along-route|沿途好去处|在顺路的地方发现惊喜|出行助手|模糊 POI 搜索|search
life|ma-life|一句话，安排聚餐（MA）|口味、人数与时间，一次交代|生活服务|餐厅订座与聚餐安排|service
life|restaurant|餐厅推荐与订座|找到合适餐厅，再确认订座|生活服务|餐厅订座与聚餐安排|service
life|pickup|顺路点单取餐|顺路点一份喜欢的餐食|生活服务|餐饮与商品下单（外卖）|service
life|hotel|酒店预订|筛选房型，确认入住安排|生活服务|住宿|service
life|tickets|电影与活动订票|安排一场期待已久的活动|生活服务|电影票|ticket
entertainment|ma-music|一句话，玩转音乐（MA）|选歌、播放与偏好，一次说清|媒资娱乐|音乐推荐与搜索|media
entertainment|ma-video|一句话，玩转视频（MA）|找回剧情，继续上次的精彩|媒资娱乐|影视推荐与查询|media
entertainment|news|新闻播报与解读|听见新动态，也了解来龙去脉|媒资娱乐|新闻播报|book'''
cats=[('smart','智慧场景','主动感知，贴心服务'),('fun','iCAR趣玩','和 iCAR 一起，发现更多乐趣'),('car','智能车控','自然对话，轻松控车'),('travel','智慧出行','更聪明的出行体验'),('life','智慧生活','出行路上的生活助手'),('entertainment','智慧娱乐','想听想看，随心畅享')]
scenes=[]
for row in rows.splitlines():
 c,i,n,d,domain,skill,icon=row.split('|');scenes.append(dict(category=c,sceneId=i,name=n,description=d,domain=domain,legacySkill=skill,icon=icon,video='',poster='',intents=[]))
queries={
'ma-car':['车里有点闷，帮我改善空气','空调调到23度','风量二档','不要直吹我','打开主驾座椅通风','副驾温度调到24度','后排风量小一点','关闭所有车窗','氛围灯换成暖色','把这套设置保存为我的偏好'],
'ma-travel':['导航去公司','途经我以前去过的那家咖啡店','顺路找有空闲充电枪的快充站','把咖啡店和充电站加入途经点并排好顺序','避开拥堵路段','尽量少走收费路段','终点设到公司园区公共入口','告诉我预计到达时间','比较一下备选路线','记住这次路线偏好'],
'ma-life':['找一家适合四个人聚餐的安静川菜馆','在附近选评价好的','人均控制在150元以内','看看今晚19点有没有空位','告诉我等位多久','确认附近能停车','口味微辣，少油','确认后帮我订座','订之前说明费用和取消规则','记住我们的聚餐偏好'],
'ma-music':['放点适合夜间驾驶的轻快音乐','优先中文女声','加入我收藏的歌曲','不要伤感歌曲','把音量降低一点','开启随机播放','跳过最近重复听过的歌','整理成夜驾歌单','推荐几首相似歌曲','记住这套音乐偏好'],
'ma-video':['找到上次没看完的家庭喜剧','先简短回顾剧情','从上次位置继续播放','开启中文字幕','画质设为高清','音量调小一点','跳过片头','关闭自动播放下一集','收藏这部作品','记住这些观看偏好']}
configs={
'child-left':('离车锁车后检测到车内儿童',['提醒车主返回查看','持续提示车内遗留风险'],['cabinPeople'],'车辆状态'),
'visibility':('检测到雨雾或玻璃起雾影响视野',['开启除雾','按需开启雨刷与后视镜加热'],['outside'],'环境感知'),
'fatigue':('DMS检测到驾驶疲劳',['提醒休息','推荐安全停车位置','确认后导航'],['cabinPeople','map'],'环境感知'),
'child-risk':('检测到儿童危险乘车行为',['提醒驾驶员关注儿童','语音提示安全乘车'],['cabinPeople'],'环境感知'),
'pet-left':('离车锁车后检测到车内宠物',['提醒车主查看宠物','提示座舱环境状态'],['cabinPeople','cabinEnv'],'车辆状态'),
'item-left':('乘员下车时检测到遗落物品',['检查车内物品','主动提醒携带'],['cabinPeople'],'车辆状态'),
'commute':('工作日早上上车时',['导航去公司','空调调到24度','准备通勤音乐'],['map','media'],'时间'),
'welcome':('上车且身份匹配成功',['读取个人Memory','恢复座椅与空调偏好','生成迎宾问候'],['memory','identity','cabinPeople'],'车辆状态'),
'content':('已配置的通勤时间与上车场景',['推荐适合旅程的内容','确认后播放'],['memory','media'],'时间'),
'scenic':('导航路线即将经过景区或地标',['识别沿途地标','生成简短介绍','合适时机语音播报'],['map'],'地点'),
'nap':('驻车且用户启动午休',['调整座椅与空调','降低音乐音量','设置休息提醒'],[],'车辆状态')}
legacyIds={'visibility':'preset_visibility','fatigue':'table_driver_guard','item-left':'table_leave_guard','welcome':'preset_memory_welcome','content':'table_media_supply','scenic':'preset_scenic'}
for s in scenes:
 i=s['sceneId']
 if i in queries:s['intents']=queries[i];s['query']='，'.join(queries[i])+'。';s['futureVideo']='assets/videos/'+i+'.mp4'
 if i in configs:
  t,a,r,k=configs[i];s['automation']={'trigger':t,'actions':a,'requires':r,'triggerType':k,'legacyId':legacyIds.get(i)}
 if i in ['find-car','parking-pay','sentry-plus']:s['video']='assets/videos/'+{'find-car':'AI停车位置记忆','parking-pay':'停车扫码支付','sentry-plus':'哨兵PLUS'}[i]+'.mp4'
data={'categories':[{'id':a,'name':b,'subtitle':c} for a,b,c in cats],'scenes':scenes}
(p/'assets/scenes-v3.js').write_text('window.ICAR_CATALOG = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n')
(p/'qa/scene-mapping.json').write_text(json.dumps(data,ensure_ascii=False,indent=2))
