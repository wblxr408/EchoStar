| **字**段                           | **类型**     | **是否**前端**消费** | **用途**                                             | **使用**功能                                                |
| ---------------------------------------- | ------------------ | -------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| **id**                             | **string**   | **是**                     | **故事**主**键**                               | **全部**                                                    |
| **content**                        | **string**   | **是**                     | **正文/**预**览**                              | **推荐**流、**详情、**随机**漫步**              |
| **images**                         | **string[]** | **是**                     | **图片**展示                                         | **推荐**流、**详情**                                  |
| **location**                       | **object**   | **是**                     | **{ latitude, longitude }**                          | **地图**跳**转、**随机**漫步**                  |
| **locationName**                   | **string**   | **是**                     | **地点**名                                           | **卡片、**下**一站**预览、详情                        |
| **emotionTag**                     | **string**   | **是**                     | **情绪**展示/**过滤**一致性                    | 地图、列表、**详情**                                        |
| **createdAt**                      | **string**   | **是**                     | **时间**展示、**最新**排序**标识**       | **列表、**聚合**点**                                  |
| **author**                         | **object**   | **是**                     | **{ id, username, avatar, vip }**                    | 卡片、详情                                                        |
| **likeCount**                      | **number**   | **是**                     | **热**度**展示**                               | **推荐**流、**聚合**点**最**热                  |
| **favoriteCount**                  | **number**   | **是**                     | **热**度**展示**                               | **推荐**流、**详情**                                  |
| **commentCount**                   | **number**   | **是**                     | **热**度**展示**                               | **推荐**流、**聚合**点**最**热                  |
| **viewCount**                      | **number**   | **否/**可**选**      | **不**建议**常**显                             | **埋**点**灰**度、**管理**台                    |
| **recommendation.bucket**          | **enum**     | **是**                     | **当前**命中**的**主**召回**桶           | **排序**说明、**埋**点                                |
| **recommendation.reasonTags**      | **array**    | **是**                     | **2-**3 **个**推荐**理由** **tag** | **卡片、**详情、**下**一站**预**览              |
| **recommendation.primaryReason**   | **string**   | **是**                     | **一句**人**话**解释                           | **详情、**随机**漫步**预**览**                  |
| **recommendation.sortModeApplied** | **enum**     | **是**                     | **`**recommend                                             | **latest**                                                  |
| **recommendation.distanceMeters**  | **number**   | **是**                     | **与**用户**距离**                             | **推荐**流、**随机**漫步                              |
| **recommendation.timeWindow**      | **object/**null    | **是**                     | **如** **{ unit:'hour', value:72 }**           | **最**热说明、tooltip                                       |
| **recommendation.isCurated**       | **boolean**  | **是**                     | **是否**人工**精选**                           | **tag、**配**额**解释                                 |
| **recommendation.debugScores**     | **object**   | **否**                     | **{ spatial, freshness... }**                        | **仅**日志/**灰**度，**不**给**普通**前端 |


| 功能                   | 必需字段                                                                                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 推荐流卡片             | **locationName**、**emotionTag**、**likeCount**、**favoriteCount**、<br />**recommendation.reasonTags[0..1]**、**recommendation.distanceMeters** |
| 故事详情               | **recommendation.reasonTags[0..2]**、**recommendation.primaryReason**、<br />**recommendation.bucket**、全部互动计数                                               |
| 随机漫步“下一站预览” | **locationName**、**recommendation.primaryReason**、**recommendation.reasonTags[0..1]**、<br />**recommendation.distanceMeters**、**createdAt**        |
| 排序说明/悬浮提示      | **recommendation.sortModeApplied**、**recommendation.timeWindow**、<br />**recommendation.bucket**                                                                 |
| 管理台/AB/排查         | **recommendation.debugScores**、**bucket**、完整计数                                                                                                                     |


**接口参数表**

| 接口                                | 主要参数                                              | 返回重点                                                            | 备注                                        |
| ----------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------- |
| **GET /v1/map/feed**          | **lat,lng,mood,page,limit,summary**             | **stories[] + pagination**，每条含 **recommendation.*** | 推荐流主接口                                |
| **GET /v1/map/random**        | `lat,lng,mood,mode=preview                            | direct`                                                             | **location + story + recommendation** |
| **GET /v1/map/explore**       | `lat,lng,radius,page,limit,summary,mood,sortBy=latest | hottest`                                                            | 附近故事列表                                |
| **GET /v1/map/clusters**      | **northEast,southWest,zoom,mood**               | 聚合点数组                                                          | **mood** 必加，保证地图一致           |
| **GET /v1/map/cluster-items** | `clusterKey 或 bounds,mood,sortBy=latest              | hottest,timeWindow=72h,page,limit`                                  | 聚合点展开列表                              |

mood：all；开心，难过，治愈，打卡

sortBy：latest。hottest，recommend


**排序规则表**

| 场景                          | 规则                                                                                                                                           | 说明                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 推荐流召回                    | 5 主桶：**local_fresh / preference_match / underexposed_quality <br />/ trending / admin_curated** + 隐藏 **fallback**             | 候选池建议**320**                      |
| 推荐流打分                    | **0.28 spatial + 0.20 emotion + 0.10 engagement + 0.18 freshness + <br />0.06 author + 0.10 novelty + 0.05 exploration + 0.03 curation** | 总和 1；符合你要的“更本地、更新鲜、更长尾” |
| 推荐流重排                    | 同作者惩罚、同情绪轻惩罚、同网格惩罚、前 6 条给少量 exploration bonus                                                                          | 保多样性                                     |
| 推荐流配额                    | 前**10** 条中 **admin_curated <= 3**；前 **20** 条中 **trending <= 6**                                                 | 防止人工和热度挤压自然内容                   |
| 随机漫步                      | 先取重排后前**24** 条，再按权重随机抽样                                                                                                  | 保留随机感，但不胡乱                         |
| 地图附近列表**latest**  | 先按**mood** 过滤，再按 **createdAt DESC**                                                                                         | 最直观                                       |
| 地图附近列表**hottest** | 先按**mood** 过滤，再按 **72h** 窗口内 **like*1 + favorite*1.6 + comment*1.8 +<br /> log(view)**                           | 只用于局部列表/聚合点，不建议覆盖推荐流      |
| 聚合点展开**latest**    | 当前聚合内按时间倒序                                                                                                                           | 简单稳定                                     |
| 聚合点展开**hottest**   | 当前聚合内按**72h** 热度排序                                                                                                             | 满足“最新/最热切换”                        |
| 情绪过滤                      | 所有地图接口先过滤后排序                                                                                                                       | 不能前端后滤                                 |
