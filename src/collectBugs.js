/**
 * 收集bug
 */
const fetch = require('node-fetch');
const { headers } = require('./config');

async function collect_bugs() {
  let today_count = 0;
  let total_count = 0;

  // 获取当前比赛场次
  const competition_info = await fetch("https://api.juejin.cn/user_api/v1/bugfix/competition", {
    headers,
    method: "POST",
    credentials: 'include',
    body: JSON.stringify({})
  }).then(res => res.json())

  if (competition_info.err_no !== 0) return Promise.reject('查询比赛场次异常');

  // 获取bug总数
  const total_bugs = await fetch("https://api.juejin.cn/user_api/v1/bugfix/user", {
    headers,
    method: "POST",
    credentials: 'include',
    body: JSON.stringify({
      competition_id: competition_info.data.competition_id
    })
  }).then(res => res.json())

  if (total_bugs.err_no !== 0) return Promise.reject('查询Bug总数异常');
  total_count = total_bugs.data.user_own_bug

  while (true) {
    // 获取bug列表
    const bugs_list = await fetch("https://api.juejin.cn/user_api/v1/bugfix/not_collect", {
      headers,
      method: "POST",
      credentials: 'include',
      body: JSON.stringify({})
    }).then(res => res.json()) 

    if (bugs_list.err_no !== 0) return Promise.reject('查询Bug列表异常');
    if (bugs_list.data.length === 0) return [today_count, total_count]
    today_count += bugs_list.data.length

    // 收取Bug
    const ret = await Promise.all(bugs_list.data.map(bug => {
      if (bug) {
        return fetch("https://api.juejin.cn/user_api/v1/bugfix/collect", {
          headers,
          method: "POST",
          credentials: 'include',
          body: JSON.stringify({
            bug_type: bug.bug_type,
            bug_time: bug.bug_time
          })
        }).then(res => res.json()) 
      }
    }))

    const r = ret.some(res => res.err_no !== 0)
    if (r) return Promise.reject('采集Bug异常')
  }
}

module.exports = collect_bugs
