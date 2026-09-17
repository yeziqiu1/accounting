/* ===========================================================
   小账本 · 记账 / 预算 / 评价 / 语音快记
   数据保存在浏览器本地（localStorage），可导出为 JSON 备份
   =========================================================== */
(function () {
  "use strict";

  /* ---------------- 常量 ---------------- */
  var STORE_KEY = "xiaozhangben.v2";

  var COLORS = ["#ff6b6b","#ff9f43","#ffd93d","#4ecdc4","#3ec1a6","#28b485","#4c9aff","#0a84ff","#7c6bff","#c86bff","#ff7ab6","#a2845e","#8c8c93","#5d6473"];

  var ICONS = ["🍜","🍚","🥐","☕️","🧋","🍰","🛍️","🛒","🧺","👕","👟","👜","💄","🧴","💍","📱","💻","🎧","🔌","🖨️","🚇","🚕","🚗","⛽️","🏠","💡","🚰","🎬","🎮","🎤","✈️","🏨","💊","🏥","📚","✏️","🎁","🐶","👶","💰","🏆","💼","📈","🧧","🧾","↩️","💳","📦","🌱","🎯"];

  var RATINGS = [
    { id: "recommend", label: "推荐", em: "⭐️" },
    { id: "good", label: "好", em: "👍" },
    { id: "ok", label: "一般", em: "😐" },
    { id: "bad", label: "不好", em: "👎" }
  ];

  var NAV = [
    { id: "overview", label: "概览", icon: "📊", sub: "今天的收支一眼看清" },
    { id: "records", label: "明细", icon: "🧾", sub: "按天翻看每一笔收支" },
    { id: "budget", label: "预算", icon: "🎯", sub: "设置预算，超支提前知道" },
    { id: "categories", label: "分类", icon: "🏷️", sub: "分类和子分类都能自己改" },
    { id: "more", label: "更多", icon: "⚙️", sub: "语音快记、快捷指令与数据备份" }
  ];

  /* 默认分类：名称 -> 关键词（用于语音 / 文本自动识别） */
  var ALIAS = {
    "餐饮": ["吃饭","早饭","午饭","晚饭","外卖","餐厅","食堂","夜宵","聚餐","咖啡","奶茶","饮料","水果","零食","面包","火锅","烧烤"],
    "早餐": ["早饭","包子","豆浆","油条"],
    "午餐": ["午饭","中饭","快餐"],
    "晚餐": ["晚饭","夜宵","烧烤","火锅"],
    "咖啡奶茶": ["咖啡","奶茶","拿铁","美式","星巴克","瑞幸","喜茶","蜜雪"],
    "外卖": ["外卖","美团","饿了么","配送"],
    "购物": ["购物","网购","下单","淘宝","京东","拼多多","商场","买东西"],
    "日用百货": ["日用","纸巾","纸巾","洗衣液","牙膏","洗发水","沐浴露","超市","杂货"],
    "家居用品": ["家居","收纳","杯子","锅","被子","家具"],
    "服饰": ["衣服","上衣","裤子","裙子","外套","卫衣","毛衣","内衣","袜子","帽子","围巾","鞋","鞋子","球鞋","靴子","包包","书包","配饰","首饰"],
    "美妆": ["美妆","化妆","口红","粉底","眼影","卸妆","美容"],
    "护肤": ["护肤","面膜","精华","面霜","防晒","洗面奶","水乳"],
    "香水": ["香水","香氛"],
    "数码": ["数码","手机","电脑","耳机","键盘","鼠标","充电","数据线","充电宝","硬盘","显示器","相机","平板"],
    "软件订阅": ["会员","订阅","会员费","app","软件","icloud","网盘"],
    "交通": ["交通","地铁","公交","地铁卡","打车","滴滴","出租车","加油","油价","停车","高速","高铁","火车","机票","单车"],
    "居住": ["居住","房租","租金","水费","电费","燃气费","天然气","物业费","宽带费"],
    "通讯": ["话费","流量","手机费","宽带"],
    "娱乐": ["娱乐","电影","电影票","游戏","充值","旅游","旅行","门票","演出","演唱会","ktv","密室","桌游","剧本杀"],
    "医疗": ["医疗","药","药店","医院","挂号","体检","看病","牙医","口罩"],
    "教育": ["教育","书","买书","课程","网课","学费","培训","文具","考试","报名"],
    "人情": ["人情","红包","礼物","请客","随礼","份子钱","送礼"],
    "宠物": ["宠物","猫粮","狗粮","猫砂","宠物医院"],
    "运动": ["健身","运动","球","瑜伽","跑步","游泳","球拍"],
    "旅行": ["旅行","旅游","机票","酒店","民宿","门票","高铁","攻略"],
    "其他": ["其他","杂项"],
    "工资": ["工资","薪水","发工资","月薪","薪酬"],
    "奖金": ["奖金","年终奖","绩效","提成"],
    "兼职": ["兼职","外快","副业","接单"],
    "投资收益": ["理财","基金","股票","利息","分红","收益"],
    "红包": ["红包","压岁钱","转账","收到"],
    "报销": ["报销","补贴","退款到账"],
    "退款": ["退款","退货"],
    "收款": ["收款","到账","进账","卖"]
  };

  /* 支出 / 收入 默认分类结构，子分类用 / 分隔 */
  var DEFAULT_CATS = [
    ["expense","餐饮","🍜","#ff9f43",["早餐/🥐","午餐/🍚","晚餐/🍲","咖啡奶茶/☕️","外卖/🛵"]],
    ["expense","购物","🛍️","#ff6b6b",["日用百货/🧺","家居用品/🛋️","礼物/🎁"]],
    ["expense","服饰","👕","#ff7ab6",["上衣裤装/👖","鞋子/👟","包包/👜","配饰/💍"]],
    ["expense","日用","🧴","#3ec1a6",["清洁用品/🧽","纸品/🧻","厨卫/🚰"]],
    ["expense","数码","📱","#4c9aff",["配件/🔌","软件订阅/💳","设备/💻"]],
    ["expense","美妆","💄","#c86bff",["护肤/🧴","彩妆/💄","香水/🌸"]],
    ["expense","交通","🚇","#0a84ff",["地铁公交/🚌","打车/🚕","加油停车/⛽️"]],
    ["expense","居住","🏠","#a2845e",["房租/🏠","水电燃气/💡","物业/🧹"]],
    ["expense","通讯","📶","#7c6bff",["话费/📞","宽带/🛜"]],
    ["expense","娱乐","🎬","#ff6b9d",["电影演出/🎬","游戏/🎮","旅行/✈️"]],
    ["expense","医疗","💊","#28b485",["药品/💊","就诊/🏥","体检/🩺"]],
    ["expense","教育","📚","#ffd93d",["书/📖","课程/🎓","文具/✏️"]],
    ["expense","人情","🎁","#ff9f43",["红包/🧧","请客/🍻","送礼/🎀"]],
    ["expense","宠物","🐶","#8c8c93",["猫狗粮/🥫","宠物医疗/🏥"]],
    ["expense","运动","🏃","#4ecdc4",["健身/🏋️","装备/🎽"]],
    ["expense","其他","📦","#8c8c93",[]],
    ["income","工资","💰","#28b485",[]],
    ["income","奖金","🏆","#ff9f43",[]],
    ["income","兼职","🧑‍💻","#4c9aff",[]],
    ["income","投资收益","📈","#3ec1a6",[]],
    ["income","红包","🧧","#ff6b6b",[]],
    ["income","报销","🧾","#7c6bff",[]],
    ["income","退款","↩️","#c86bff",[]],
    ["income","其他","💵","#8c8c93",[]]
  ];

  /* ---------------- 工具 ---------------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function pad2(n) { return n < 10 ? "0" + n : "" + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function nowTime() { var d = new Date(); return pad2(d.getHours()) + ":" + pad2(d.getMinutes()); }
  function dateObj(s) { var p = String(s).split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function toDateStr(d) { return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate()); }
  function shiftDate(s, n) { var d = dateObj(s); d.setDate(d.getDate() + n); return toDateStr(d); }
  function monthKey(s) { return String(s).slice(0, 7); }
  function thisMonth() { return todayStr().slice(0, 7); }
  function monthLabel(mk) { var p = mk.split("-"); return p[0] + "年" + (+p[1]) + "月"; }
  function daysInMonth(mk) { var p = mk.split("-"); return new Date(+p[0], +p[1], 0).getDate(); }
  function shiftMonth(mk, n) { var p = mk.split("-"), d = new Date(+p[0], +p[1] - 1 + n, 1); return d.getFullYear() + "-" + pad2(d.getMonth() + 1); }
  function round2(n) { return Math.round((+n + Number.EPSILON) * 100) / 100; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtMoney(n) {
    var v = Math.abs(round2(n || 0));
    return "¥" + v.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtMoneyLite(n) {
    var v = Math.abs(round2(n || 0));
    var isInt = Math.abs(v - Math.round(v)) < 0.005;
    return "¥" + v.toLocaleString("zh-CN", { minimumFractionDigits: isInt ? 0 : 2, maximumFractionDigits: 2 });
  }
  function hexToRgba(hex, a) {
    var h = String(hex || "#8c8c93").replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var num = parseInt(h, 16) || 0;
    return "rgba(" + ((num >> 16) & 255) + "," + ((num >> 8) & 255) + "," + (num & 255) + "," + a + ")";
  }
  function sum(list) { return round2(list.reduce(function (a, t) { return a + (+t.amount || 0); }, 0)); }
  function weekday(s) { return "日一二三四五六".charAt(dateObj(s).getDay()); }
  function dateHuman(s) {
    var d = dateObj(s), t = dateObj(todayStr());
    var diff = Math.round((t - d) / 86400000);
    if (diff === 0) return "今天";
    if (diff === 1) return "昨天";
    if (diff === 2) return "前天";
    return (+s.slice(5, 7)) + "月" + (+s.slice(8, 10)) + "日";
  }
  function ratingInfo(id) {
    for (var i = 0; i < RATINGS.length; i++) if (RATINGS[i].id === id) return RATINGS[i];
    return null;
  }
  function typeLabel(t) { return t === "income" ? "收入" : "支出"; }

  /* ---------------- 状态 ---------------- */
  var state = null;
  var view = { tab: "overview", month: thisMonth(), recType: "all", recQ: "", catTab: "expense" };
  var draft = null;
  var catDraft = null;

  function defaultState(withDemo) {
    var cats = [];
    DEFAULT_CATS.forEach(function (row) {
      var parent = { id: uid(), type: row[0], name: row[1], icon: row[2], color: row[3], parentId: null };
      cats.push(parent);
      row[4].forEach(function (child) {
        var seg = child.split("/");
        cats.push({ id: uid(), type: row[0], name: seg[0], icon: seg[1] || parent.icon, color: parent.color, parentId: parent.id });
      });
    });
    var s = {
      version: 1,
      settings: { theme: "auto", monthlyBudget: 0, currency: "¥" },
      budgets: {},
      categories: cats,
      transactions: []
    };
    if (withDemo) s.transactions = demoTransactions(cats);
    return s;
  }

  function demoTransactions(cats) {
    function pick(type, name) {
      for (var i = 0; i < cats.length; i++) if (cats[i].type === type && cats[i].name === name && !cats[i].parentId) return cats[i].id;
      return null;
    }
    function leaf(parentName, childName) {
      var p = pick("expense", parentName), hit = null;
      cats.forEach(function (c) { if (c.parentId === p && c.name === childName) hit = c.id; });
      return hit || p;
    }
    var t = [
      [0, "leaf", "餐饮", "午餐", "公司楼下的简餐", 32, "ok", ""],
      [0, "leaf", "餐饮", "咖啡奶茶", "瑞幸生椰拿铁", 19.9, "recommend", "回购五次了，性价比高，冰的不加糖最好喝"],
      [0, "leaf", "日用", "纸品", "抽纸囤货", 39.9, "good", "厚实不掉屑，比上次那个牌子好"],
      [1, "leaf", "交通", "打车", "加班打车回家", 46.5, null, ""],
      [1, "leaf", "购物", "日用百货", "超市采购", 128.4, "ok", ""],
      [2, "leaf", "服饰", "鞋子", "跑鞋", 469, "recommend", "缓震很好，跑十公里不磨脚，强烈推荐"],
      [2, "leaf", "餐饮", "早餐", "包子豆浆", 8.5, "good", "热乎便宜"],
      [3, "leaf", "数码", "配件", "Type-C 数据线", 59, "bad", "两周就接触不良，别买这家"],
      [3, "leaf", "餐饮", "晚餐", "朋友聚餐", 218, "good", "味道不错，人多上菜有点慢"],
      [4, "leaf", "美妆", "护肤", "面膜一盒", 89, "ok", ""],
      [5, "leaf", "娱乐", "电影演出", "电影票两张", 96, "recommend", "剧情紧凑，值得进影院"],
      [5, "leaf", "餐饮", "外卖", "螺蛳粉外卖", 27, "good", ""],
      [6, "leaf", "居住", "水电燃气", "电费", 156.3, null, ""],
      [7, "leaf", "交通", "地铁公交", "地铁通勤", 12, null, ""],
      [8, "leaf", "教育", "书", "专业书两本", 118, "recommend", "内容扎实，反复看很有收获"],
      [9, "leaf", "医疗", "药品", "感冒药", 36.8, null, ""],
      [10, "leaf", "购物", "家居用品", "收纳箱", 79, "good", "结实能叠放"],
      [11, "leaf", "娱乐", "旅行", "周边民宿一晚", 499, "recommend", "院子很大，早上有雾，拍照很好看"],
      [12, "leaf", "餐饮", "午餐", "食堂", 22, "ok", ""],
      [13, "leaf", "人情", "请客", "同事生日请客", 260, null, ""]
    ];
    var out = [];
    t.forEach(function (r) {
      var daysAgo = r[0], id = catIdByName(cats, r[2], r[3]);
      if (!id) id = pick("expense", r[2]);
      if (!id) return;
      out.push({
        id: uid(), type: "expense", amount: r[5], title: r[4], categoryId: id,
        date: shiftDate(todayStr(), -daysAgo), time: "1" + (daysAgo % 9) + ":20",
        rating: r[6], reason: r[7], note: "", source: "manual",
        createdAt: Date.now() - daysAgo * 86400000
      });
    });
    var salary = pick("income", "工资");
    out.push({ id: uid(), type: "income", amount: 16800, title: "9 月工资", categoryId: salary, date: shiftDate(todayStr(), -0).slice(0, 8) + "05", time: "10:02", rating: null, reason: "", note: "", source: "manual", createdAt: Date.now() });
    var bonus = pick("income", "兼职");
    out.push({ id: uid(), type: "income", amount: 1200, title: "周末接单", categoryId: bonus, date: shiftDate(todayStr(), -4), time: "20:10", rating: null, reason: "", note: "朋友介绍的私活", source: "manual", createdAt: Date.now() });
    var refund = pick("income", "退款");
    out.push({ id: uid(), type: "income", amount: 59, title: "数据线退款", categoryId: refund, date: shiftDate(todayStr(), -1), time: "15:40", rating: null, reason: "", note: "质量太差退了", source: "manual", createdAt: Date.now() });
    return out;
  }

  function catIdByName(cats, parentName, childName) {
    var pid = null, cid = null;
    cats.forEach(function (c) { if (!c.parentId && c.name === parentName) pid = c.id; });
    cats.forEach(function (c) { if (c.parentId === pid && c.name === childName) cid = c.id; });
    return cid || pid;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || !s.categories || !s.transactions) return null;
      s.settings = s.settings || { theme: "auto", monthlyBudget: 0 };
      s.budgets = s.budgets || {};
      return s;
    } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { toast("本地存储写入失败，请检查浏览器隐私设置"); }
  }

  /* ---------------- 分类辅助 ---------------- */
  function cat(id) {
    for (var i = 0; i < state.categories.length; i++) if (state.categories[i].id === id) return state.categories[i];
    return null;
  }
  function rootOf(id) {
    var c = cat(id);
    while (c && c.parentId) c = cat(c.parentId);
    return c;
  }
  function childrenOf(id) { return state.categories.filter(function (c) { return c.parentId === id; }); }
  function rootsOf(type) { return state.categories.filter(function (c) { return !c.parentId && c.type === type; }); }
  function catLabel(id) {
    var c = cat(id);
    if (!c) return "未分类";
    if (c.parentId) { var p = cat(c.parentId); return (p ? p.name + " · " : "") + c.name; }
    return c.name;
  }
  function ensureOther(type) {
    var list = rootsOf(type);
    for (var i = 0; i < list.length; i++) if (list[i].name === "其他") return list[i].id;
    var c = { id: uid(), type: type, name: "其他", icon: type === "income" ? "💵" : "📦", color: "#8c8c93", parentId: null };
    state.categories.push(c);
    return c.id;
  }
  /* 关键词索引：用于语音 / 文本自动识别分类 */
  function buildKeywordIndex() {
    var idx = [];
    state.categories.forEach(function (c) {
      var words = [c.name].concat(ALIAS[c.name] || []);
      words.forEach(function (w) {
        if (!w) return;
        idx.push({ word: w.toLowerCase(), id: c.id, depth: c.parentId ? 1 : 0 });
      });
    });
    idx.sort(function (a, b) { return b.word.length - a.word.length; });
    return idx;
  }

  /* ---------------- 渲染调度 ---------------- */
  function renderNav() {
    var html = NAV.map(function (n) {
      return '<button class="nav-item' + (view.tab === n.id ? " active" : "") + '" data-action="tab" data-tab="' + n.id + '">' +
        '<span class="ico">' + n.icon + "</span><span>" + n.label + "</span></button>";
    }).join("");
    document.querySelectorAll("[data-nav]").forEach(function (el) { el.innerHTML = html; });
  }

  function render() {
    var meta = NAV.filter(function (n) { return n.id === view.tab; })[0] || NAV[0];
    $("#pageTitle").textContent = meta.label;
    $("#pageSub").textContent = meta.sub;
    renderNav();
    ["overview", "records", "budget", "categories", "more"].forEach(function (id) {
      var el = document.getElementById("view-" + id);
      if (!el) return;
      if (id === view.tab) {
        el.classList.add("active");
        el.innerHTML = renderers[id]();
      } else {
        el.classList.remove("active");
      }
    });
    applyTheme();
  }

  function go(tab) {
    view.tab = tab;
    render();
    var sc = $("#scroll");
    if (sc) sc.scrollTop = 0;
  }

  /* ---------------- 概览 ---------------- */
  function renderOverview() {
    var mk = view.month;
    var monthTx = state.transactions.filter(function (t) { return monthKey(t.date) === mk; });
    var income = sum(monthTx.filter(function (t) { return t.type === "income"; }));
    var expense = sum(monthTx.filter(function (t) { return t.type === "expense"; }));
    var balance = round2(income - expense);
    var budget = +state.settings.monthlyBudget || 0;
    var pct = budget > 0 ? Math.min(100, (expense / budget) * 100) : 0;
    var over = budget > 0 && expense > budget;
    var daysLeft = mk === thisMonth() ? Math.max(1, daysInMonth(mk) - new Date().getDate() + 1) : daysInMonth(mk);
    var avg = budget > 0 ? Math.max(0, budget - expense) / daysLeft : 0;

    var html = "";
    html += '<div class="card hero">' +
      '<div class="hero-top">' +
        '<div><div class="hero-label">' + monthLabel(mk) + " 支出</div>" +
        '<div class="hero-amount num" style="color:var(--expense)">' + fmtMoney(expense) + "</div></div>" +
        '<div class="row" style="gap:6px">' +
          '<button class="btn-icon" data-action="month-move" data-n="-1" title="上个月">‹</button>' +
          '<button class="btn-text" data-action="month-now">本月</button>' +
          '<button class="btn-icon" data-action="month-move" data-n="1" title="下个月">›</button>' +
        "</div>" +
      "</div>" +
      '<div class="stat-row">' +
        '<div class="stat income"><div class="k"><i class="dot income"></i>收入</div><div class="v num">' + fmtMoney(income) + "</div></div>" +
        '<div class="stat expense"><div class="k"><i class="dot expense"></i>支出</div><div class="v num">' + fmtMoney(expense) + "</div></div>" +
        '<div class="stat"><div class="k">结余</div><div class="v num" style="color:' + (balance >= 0 ? "var(--income)" : "var(--expense)") + '">' + (balance >= 0 ? "" : "-") + fmtMoney(balance) + "</div></div>" +
      "</div>" +
      '<div class="divider"></div>' +
      (budget > 0
        ? '<div class="between small"><span class="muted">本月预算 ' + fmtMoney(budget) + "</span>" +
          '<span class="' + (over ? "" : "muted") + '" style="' + (over ? "color:var(--expense);font-weight:600" : "") + '">' +
          (over ? "已超支 " + fmtMoney(expense - budget) : "还可花 " + fmtMoney(budget - expense) + " · 日均 " + fmtMoneyLite(avg)) + "</span></div>" +
          '<div class="pbar" style="margin-top:8px"><i style="width:' + pct + "%;background:" + (over ? "var(--expense)" : pct > 80 ? "var(--warn)" : "var(--accent)") + '"></i></div>'
        : '<div class="between small"><span class="muted">还没有设置本月预算</span><button class="link" data-action="tab" data-tab="budget">去设置 ›</button></div>') +
      "</div>";

    /* 图表：近 14 天 */
    var days = [], i;
    for (i = 13; i >= 0; i--) days.push(shiftDate(todayStr(), -i));
    var series = days.map(function (d) {
      var list = state.transactions.filter(function (t) { return t.date === d; });
      return {
        d: d,
        e: sum(list.filter(function (t) { return t.type === "expense"; })),
        i: sum(list.filter(function (t) { return t.type === "income"; }))
      };
    });
    var max = 1, incTotal = 0, expTotal = 0;
    series.forEach(function (s) { max = Math.max(max, s.e); incTotal = round2(incTotal + s.i); expTotal = round2(expTotal + s.e); });
    html += '<div class="card"><div class="card-head"><div><h3>近 14 天每日支出</h3><p>柱形越高，当天花得越多</p></div>' +
      '<div class="legend"><span class="row" style="gap:5px"><i class="dot expense"></i>支出</span><span class="row" style="gap:5px"><i class="dot income"></i>有收入</span></div></div>' +
      '<div class="bars">' + series.map(function (s, idx) {
        var eh = s.e > 0 ? Math.max(3, (s.e / max) * 100) : 0;
        return '<div class="col' + (s.d === todayStr() ? " today" : "") + '">' +
          '<div class="stack"><i class="bar exp" style="height:' + eh + '%"></i></div>' +
          '<span class="mk">' + (s.i > 0 ? '<i class="dot income"></i>' : "") + "</span>" +
          '<span class="lbl">' + (+s.d.slice(8, 10)) + (idx === series.length - 1 ? "日" : "") + "</span></div>";
      }).join("") + "</div>" +
      '<div class="legend" style="margin-top:12px;justify-content:space-between"><span>14 天支出 <b class="num">' + fmtMoney(expTotal) + '</b></span><span>14 天收入 <b class="num">' + fmtMoney(incTotal) + "</b></span></div></div>";

    /* 分类占比 */
    var byRoot = {};
    monthTx.filter(function (t) { return t.type === "expense"; }).forEach(function (t) {
      var r = rootOf(t.categoryId);
      var key = r ? r.id : "none";
      if (!byRoot[key]) byRoot[key] = { name: r ? r.name : "未分类", icon: r ? r.icon : "📦", color: r ? r.color : "#8c8c93", amount: 0, n: 0 };
      byRoot[key].amount = round2(byRoot[key].amount + (+t.amount || 0));
      byRoot[key].n++;
    });
    var groups = Object.keys(byRoot).map(function (k) { return byRoot[k]; }).sort(function (a, b) { return b.amount - a.amount; });
    var topAmount = groups.length ? groups[0].amount : 0;
    html += '<div class="card"><div class="card-head"><div><h3>钱花在哪里</h3><p>' + monthLabel(mk) + " 共 " + monthTx.filter(function (t) { return t.type === "expense"; }).length + " 笔支出</p></div>" +
      '<button class="link" data-action="tab" data-tab="records">全部明细 ›</button></div>' +
      (groups.length
        ? groups.slice(0, 7).map(function (g) {
            var share = expense > 0 ? (g.amount / expense) * 100 : 0;
            return '<div class="bar-row"><div class="row" style="gap:9px;min-width:0">' +
              '<span class="tx-ico-sm" style="width:26px;height:26px;border-radius:9px;display:grid;place-items:center;font-size:14px;background:' + hexToRgba(g.color, .16) + '">' + g.icon + "</span>" +
              '<span class="ellipsis">' + esc(g.name) + " <span class=\"muted small\">" + g.n + " 笔</span></span></div>" +
              '<div class="bar-track"><i style="width:' + (topAmount > 0 ? (g.amount / topAmount) * 100 : 0) + "%;background:" + g.color + '"></i></div>' +
              '<div class="num strong" style="text-align:right">' + fmtMoneyLite(g.amount) + " <span class=\"muted small\">" + share.toFixed(0) + "%</span></div></div>";
          }).join("")
        : '<div class="empty"><span class="big">🌱</span><span>这个月还没有支出记录</span><button class="btn primary mini" data-action="open-entry">记第一笔</button></div>') +
      "</div>";

    /* 我的评价 */
    var rated = state.transactions.filter(function (t) { return t.rating; }).sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); }).slice(0, 3);
    if (rated.length) {
      html += '<div class="card"><div class="card-head"><div><h3>我的购物评价</h3><p>好与不好都记下来，下次照着买</p></div></div>' +
        '<div class="tx-list" style="box-shadow:none;border:0">' + rated.map(function (t) { return txRow(t, true); }).join("") + "</div></div>";
    }

    /* 最近记录 */
    var recent = monthTx.slice().sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); }).slice(0, 6);
    html += '<div class="card"><div class="card-head"><div><h3>最近记录</h3><p>' + monthLabel(mk) + "</p></div>" +
      '<button class="link" data-action="tab" data-tab="records">看全部 ›</button></div>' +
      (recent.length
        ? '<div class="tx-list" style="box-shadow:none;border:0">' + recent.map(function (t) { return txRow(t, true); }).join("") + "</div>"
        : '<div class="empty"><span class="big">✍️</span><span>还没有记录，点右上角「＋」开始</span></div>') +
      "</div>";

    return html;
  }

  /* 单条记录（列表行） */
  function txRow(t, withDate) {
    var c = cat(t.categoryId), root = rootOf(t.categoryId);
    var color = (c && c.color) || (root && root.color) || "#8c8c93";
    var icon = (c && c.icon) || (root && root.icon) || "📦";
    var ri = ratingInfo(t.rating);
    var sub = [];
    sub.push('<span class="ellipsis">' + esc(catLabel(t.categoryId)) + "</span>");
    if (withDate) sub.push("<span>·</span><span>" + dateHuman(t.date) + " " + esc(t.time || "") + "</span>");
    if (t.source === "voice") sub.push('<span class="tag">语音</span>');
    if (t.source === "shortcut") sub.push('<span class="tag">快捷指令</span>');
    if (t.note) sub.push("<span>·</span><span class=\"ellipsis\">" + esc(t.note) + "</span>");
    var reason = "";
    if (ri) {
      reason = '<div class="reason"><span class="tag r-' + ri.id + '">' + ri.em + " " + ri.label + "</span>" +
        (t.reason ? "<span class=\"ellipsis\">" + esc(t.reason) + "</span>" : "") + "</div>";
    }
    return '<div class="tx-row">' +
      '<button class="tx" data-action="edit-entry" data-id="' + t.id + '">' +
        '<span class="ico" style="background:' + hexToRgba(color, .16) + '">' + icon + "</span>" +
        '<span class="mid grow"><span class="ttl">' + esc(t.title || catLabel(t.categoryId)) + "</span>" +
        '<span class="sub">' + sub.join("") + "</span></span>" +
        '<span class="amt num ' + t.type + '">' + (t.type === "income" ? "+" : "-") + fmtMoney(t.amount) + "</span>" +
      "</button>" + reason + "</div>";
  }

  /* ---------------- 明细 ---------------- */
  function renderRecords() {
    var html = "";
    html += '<div class="card">' +
      '<div class="between" style="gap:10px;flex-wrap:wrap">' +
        '<div class="seg" style="flex:0 0 240px">' +
          ["all", "expense", "income"].map(function (k) {
            var label = k === "all" ? "全部" : typeLabel(k);
            return '<button class="' + (view.recType === k ? "active" : "") + '" data-action="rec-type" data-type="' + k + '">' + label + "</button>";
          }).join("") +
        "</div>" +
        '<input class="input" type="month" value="' + view.month + '" data-field="recMonth" style="width:170px;flex:0 0 auto" />' +
      "</div>" +
      '<div class="row" style="margin-top:12px">' +
        '<input class="input" id="recQ" placeholder="搜索名称、备注、评价理由…" value="' + esc(view.recQ) + '" />' +
      "</div></div>";
    html += '<div id="recordsList"></div>';
    return html;
  }

  function renderRecordsList() {
    var box = document.getElementById("recordsList");
    if (!box) return;
    var list = state.transactions.filter(function (t) {
      if (monthKey(t.date) !== view.month) return false;
      if (view.recType !== "all" && t.type !== view.recType) return false;
      if (view.recQ) {
        var hay = [t.title, t.note, t.reason, catLabel(t.categoryId)].join(" ").toLowerCase();
        if (hay.indexOf(view.recQ.toLowerCase()) < 0) return false;
      }
      return true;
    }).sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });

    var income = sum(list.filter(function (t) { return t.type === "income"; }));
    var expense = sum(list.filter(function (t) { return t.type === "expense"; }));
    var head = '<div class="card" style="padding:13px 16px"><div class="between small" style="flex-wrap:wrap;gap:4px 14px">' +
      "<span class=\"muted\" style=\"white-space:nowrap\">" + monthLabel(view.month) + " · " + list.length + " 笔</span>" +
      '<span class="row" style="gap:14px"><span>支出 <b class="num" style="color:var(--expense)">' + fmtMoney(expense) + "</b></span>" +
      '<span>收入 <b class="num" style="color:var(--income)">' + fmtMoney(income) + "</b></span></span></div></div>";

    if (!list.length) {
      box.innerHTML = head + '<div class="card"><div class="empty"><span class="big">🔍</span><span>这个条件下没有记录</span></div></div>';
      return;
    }

    var byDate = {}, dates = [];
    list.forEach(function (t) {
      if (!byDate[t.date]) { byDate[t.date] = []; dates.push(t.date); }
      byDate[t.date].push(t);
    });
    var body = dates.map(function (d) {
      var dayList = byDate[d];
      var de = sum(dayList.filter(function (t) { return t.type === "expense"; }));
      var di = sum(dayList.filter(function (t) { return t.type === "income"; }));
      var parts = [];
      if (de > 0) parts.push('支出 <b class="num">' + fmtMoney(de) + "</b>");
      if (di > 0) parts.push('收入 <b class="num" style="color:var(--income)">' + fmtMoney(di) + "</b>");
      return '<div class="day"><div class="day-head"><span>' + dateHuman(d) + " 周" + weekday(d) + " · " + d.slice(5).replace("-", "/") + "</span>" +
        "<span>" + parts.join(" · ") + "</span></div>" +
        '<div class="tx-list">' + dayList.map(function (t) { return txRow(t, false); }).join("") + "</div></div>";
    }).join("");
    box.innerHTML = head + body;
  }

  /* ---------------- 预算 ---------------- */
  function renderBudget() {
    var mk = view.month;
    var budget = +state.settings.monthlyBudget || 0;
    var monthTx = state.transactions.filter(function (t) { return monthKey(t.date) === mk && t.type === "expense"; });
    var expense = sum(monthTx);
    var pct = budget > 0 ? (expense / budget) * 100 : 0;
    var over = budget > 0 && expense > budget;
    var days = daysInMonth(mk);
    var daysLeft = mk === thisMonth() ? Math.max(1, days - new Date().getDate() + 1) : days;
    var html = "";

    html += '<div class="card">' +
      '<div class="between" style="flex-wrap:wrap;gap:12px">' +
        "<div><h3>月度总预算</h3><p class=\"hint\">" + monthLabel(mk) + " · 已用 " + fmtMoney(expense) + " / 预算 " + (budget ? fmtMoney(budget) : "未设置") + "</p></div>" +
        '<div class="row" style="gap:6px">' +
          '<button class="btn-icon" data-action="month-move" data-n="-1">‹</button>' +
          '<button class="btn-text" data-action="month-now">本月</button>' +
          '<button class="btn-icon" data-action="month-move" data-n="1">›</button>' +
        "</div>" +
      "</div>" +
      '<div class="field" style="margin:14px 0 10px"><label>预算金额（元）</label>' +
        '<div class="row" style="gap:8px"><input class="input num" type="number" min="0" step="100" inputmode="decimal" placeholder="例如 6000" value="' + (budget || "") + '" data-budget="total" style="font-size:18px;font-weight:600" />' +
        '<button class="btn primary" data-action="budget-save-total">保存</button></div></div>' +
      (budget > 0
        ? '<div class="pbar" style="height:11px"><i style="width:' + Math.min(100, pct) + "%;background:" + (over ? "var(--expense)" : pct > 80 ? "var(--warn)" : "var(--accent)") + '"></i></div>' +
          '<div class="between small" style="margin-top:9px"><span class="muted">已用 ' + pct.toFixed(0) + "%</span>" +
          (over
            ? '<span style="color:var(--expense);font-weight:600">已超支 ' + fmtMoney(expense - budget) + "</span>"
            : '<span class="muted">剩余 ' + fmtMoney(budget - expense) + " · 每天可用 " + fmtMoneyLite(Math.max(0, budget - expense) / daysLeft) + "</span>") +
          "</div>"
        : '<div class="hint">按月设一个总数，再给常花的分类单独限额，超支会在这里提醒你。</div>') +
      "</div>";

    /* 分类预算 */
    var roots = rootsOf("expense");
    var spentByRoot = {};
    monthTx.forEach(function (t) {
      var r = rootOf(t.categoryId);
      if (!r) return;
      spentByRoot[r.id] = round2((spentByRoot[r.id] || 0) + (+t.amount || 0));
    });
    var rows = roots.slice().sort(function (a, b) {
      var sa = spentByRoot[a.id] || 0, sb = spentByRoot[b.id] || 0;
      var ba = +state.budgets[a.id] || 0, bb = +state.budgets[b.id] || 0;
      if ((ba > 0) !== (bb > 0)) return ba > 0 ? -1 : 1;
      return sb - sa;
    });
    html += '<div class="card"><div class="card-head"><div><h3>分类预算</h3><p>只填写需要控制的那几项就够了</p></div></div>';
    html += rows.map(function (c) {
      var b = +state.budgets[c.id] || 0;
      var s = spentByRoot[c.id] || 0;
      var p = b > 0 ? (s / b) * 100 : 0;
      var o = b > 0 && s > b;
      return '<div style="padding:11px 0;border-top:1px solid var(--line)">' +
        '<div class="between" style="gap:10px">' +
          '<div class="row" style="gap:9px;min-width:0">' +
            '<span style="width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:' + hexToRgba(c.color, .16) + '">' + c.icon + "</span>" +
            '<span class="strong ellipsis">' + esc(c.name) + "</span>" +
            '<span class="muted small num">已用 ' + fmtMoneyLite(s) + "</span>" +
          "</div>" +
          '<div class="row" style="gap:6px"><span class="muted small">预算</span>' +
            '<input class="input num" type="number" min="0" step="50" inputmode="decimal" placeholder="不限" value="' + (b || "") + '" data-budget="' + c.id + '" style="width:104px;padding:7px 9px;text-align:right" /></div>' +
        "</div>" +
        (b > 0
          ? '<div class="pbar" style="margin-top:9px;height:7px"><i style="width:' + Math.min(100, p) + "%;background:" + (o ? "var(--expense)" : c.color) + '"></i></div>' +
            '<div class="between small" style="margin-top:5px"><span class="muted">' + p.toFixed(0) + "%</span>" +
            '<span style="' + (o ? "color:var(--expense);font-weight:600" : "color:var(--text-3)") + '">' + (o ? "超支 " + fmtMoney(s - b) : "剩 " + fmtMoney(b - s)) + "</span></div>"
          : "") +
        "</div>";
    }).join("");
    html += '<div class="hint" style="margin-top:12px">修改数字后会自动保存。</div></div>';

    html += '<div class="card"><div class="card-head"><div><h3>本月每天花了多少</h3><p>按日对比，找出花得多的日子</p></div></div>' +
      dayListHTML(mk) + "</div>";
    return html;
  }

  function dayListHTML(mk) {
    var total = daysInMonth(mk), i, max = 1, data = [];
    for (i = 1; i <= total; i++) {
      var ds = mk + "-" + pad2(i);
      var v = sum(state.transactions.filter(function (t) { return t.date === ds && t.type === "expense"; }));
      data.push({ d: ds, day: i, v: v });
      if (v > max) max = v;
    }
    var monthTotal = round2(data.reduce(function (a, x) { return a + x.v; }, 0));
    var avg = monthTotal / total;
    return '<div class="bars" style="height:104px;gap:3px">' + data.map(function (x) {
      var h = x.v > 0 ? Math.max(4, (x.v / max) * 100) : 0;
      var isToday = x.d === todayStr();
      return '<div class="col' + (isToday ? " today" : "") + '" title="' + x.d + " " + fmtMoney(x.v) + '">' +
        '<div class="stack"><i class="bar exp" style="height:' + h + "%;max-width:9px;background:" + (x.v > avg ? "linear-gradient(180deg,#ff8a80,#ff453a)" : "linear-gradient(180deg,#ffc9c4,#ff9a91)") + '"></i></div>' +
        '<span class="lbl">' + (x.day % 5 === 0 || x.day === 1 ? x.day : "") + "</span></div>";
    }).join("") + "</div>" +
    '<div class="legend" style="margin-top:10px;justify-content:space-between"><span>日均 ' + fmtMoneyLite(avg) + "</span><span>最高 " + fmtMoneyLite(max) + "</span><span>合计 " + fmtMoney(monthTotal) + "</span></div>";
  }

  /* ---------------- 分类管理 ---------------- */
  function usedCount(id) {
    return state.transactions.filter(function (t) { return t.categoryId === id; }).length;
  }
  function renderCategories() {
    var type = view.catTab;
    var roots = rootsOf(type);
    var html = "";
    html += '<div class="card">' +
      '<div class="between" style="flex-wrap:wrap;gap:10px">' +
        '<div class="seg" style="flex:0 0 240px">' +
          '<button class="' + (type === "expense" ? "active" : "") + '" data-action="cat-tab" data-type="expense">支出分类</button>' +
          '<button class="' + (type === "income" ? "active" : "") + '" data-action="cat-tab" data-type="income">收入分类</button>' +
        "</div>" +
        '<button class="btn primary mini" data-action="cat-add" data-type="' + type + '">＋ 新建一级分类</button>' +
      "</div>" +
      '<div class="hint" style="margin-top:11px">每个分类都能改名字、换图标和颜色；一级分类下面可以继续加子分类。记账时选中子分类，统计会自动合并到一级分类。</div>' +
      "</div>";

    html += roots.map(function (c) {
      var kids = childrenOf(c.id);
      var total = usedCount(c.id) + kids.reduce(function (a, k) { return a + usedCount(k.id); }, 0);
      return '<div class="cat-block">' +
        '<div class="cat-parent">' +
          '<span class="ico" style="background:' + c.color + '">' + c.icon + "</span>" +
          '<span class="grow"><span class="strong">' + esc(c.name) + '</span>' +
            '<div class="small muted">' + kids.length + " 个子分类 · " + total + " 笔记录</div></span>" +
          '<button class="btn mini" data-action="cat-edit" data-id="' + c.id + '">编辑</button>' +
        "</div>" +
        '<div class="cat-children">' +
          kids.map(function (k) {
            return '<button class="sub-chip" data-action="cat-edit" data-id="' + k.id + '">' + k.icon + " " + esc(k.name) + (usedCount(k.id) ? ' <span class="muted">' + usedCount(k.id) + "</span>" : "") + "</button>";
          }).join("") +
          '<button class="sub-chip add" data-action="cat-add" data-type="' + type + '" data-parent="' + c.id + '">＋ 子分类</button>' +
        "</div>" +
        "</div>";
    }).join("");
    if (!roots.length) html += '<div class="card"><div class="empty"><span class="big">🏷️</span><span>还没有分类</span></div></div>';
    return html;
  }

  function renderCatForm() {
    var d = catDraft;
    var parent = d.parentId ? cat(d.parentId) : null;
    var isNew = !d.id;
    var html = "";
    if (parent) html += '<div class="hint" style="margin-bottom:12px">子分类 · 上级：' + esc(parent.name) + "</div>";
    html += '<div class="field"><label>分类名称</label><input class="input" id="catName" placeholder="例如 咖啡奶茶" value="' + esc(d.name || "") + '" /></div>';
    html += '<div class="field"><label>图标</label><div class="icon-grid">' +
      ICONS.map(function (i) { return '<button data-action="icon-pick" data-icon="' + i + '" class="' + (i === d.icon ? "active" : "") + '">' + i + "</button>"; }).join("") +
      "</div></div>";
    html += '<div class="field"><label>颜色</label><div class="swatches">' +
      COLORS.map(function (c) { return '<button class="swatch' + (c === d.color ? " active" : "") + '" data-action="color-pick" data-color="' + c + '" style="background:' + c + '"></button>'; }).join("") +
      "</div></div>";
    if (!isNew) {
      html += '<div class="divider"></div><button class="btn block" data-action="cat-del" data-id="' + d.id + '" style="color:var(--expense)">删除这个分类</button>';
    } else {
      html += '<div class="hint">新分类会加入到你刚才所在的分类列表里。</div>';
    }
    return html;
  }

  /* ---------------- 更多 ---------------- */
  function baseUrl() {
    if (location.protocol === "file:") return location.href.split("?")[0].split("#")[0];
    return location.origin + location.pathname;
  }
  function renderMore() {
    var html = "";
    var total = state.transactions.length;
    var rated = state.transactions.filter(function (t) { return t.rating; }).length;
    var speaks = state.transactions.filter(function (t) { return t.source === "voice"; }).length;
    var su = state.transactions.filter(function (t) { return t.source === "shortcut"; }).length;

    html += '<div class="card"><div class="card-head"><div><h3>语音快记</h3><p>说一句话就能自动填好金额、名称、分类和日期</p></div></div>' +
      '<div class="row" style="gap:10px;flex-wrap:wrap"><button class="btn primary" data-action="open-voice">🎙️ 开始说话</button>' +
      '<span class="hint">已用语音记 ' + speaks + " 笔</span></div>" +
      '<div class="hint" style="margin-top:10px">示例：「午餐 32 元 公司楼下，味道一般」「昨天打车 46 块」。</div></div>';

    var sample = baseUrl() + "?amount=19.9&title=瑞幸生椰拿铁&category=咖啡奶茶&date=" + todayStr() + "&type=expense&rating=recommend&reason=好喝&save=1";
    html += '<div class="card"><div class="card-head"><div><h3>苹果快捷指令直连</h3><p>截图或分享菜单一键记账</p></div></div>' +
      '<div class="code" id="shortcutUrl">' + esc(sample) + "</div>" +
      '<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">' +
        '<button class="btn primary mini" data-action="copy-url">复制这条链接</button>' +
        '<button class="btn mini" data-action="test-shortcut">在本机试一下</button>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<div class="card-head" style="margin-bottom:8px"><h3 style="font-size:14px">支持的参数</h3></div>' +
      '<div class="kv small">' +
        '<span class="k">amount</span><span class="v">金额（必填）</span>' +
        '<span class="k">title</span><span class="v">货物 / 商家名称</span>' +
        '<span class="k">category</span><span class="v">分类或子分类名，如 咖啡奶茶</span>' +
        '<span class="k">date / time</span><span class="v">2026-09-17 / 13:20</span>' +
        '<span class="k">type</span><span class="v">expense 支出（默认）或 income 收入</span>' +
        '<span class="k">rating</span><span class="v">recommend / good / ok / bad</span>' +
        '<span class="k">reason / note</span><span class="v">评价理由 / 备注</span>' +
        '<span class="k">save</span><span class="v">1 直接保存，0 打开表单确认</span>' +
        '<span class="k">text</span><span class="v">一句话文本，交给小账本自己解析</span>' +
      "</div>" +
      '<div class="divider"></div>' +
      '<div class="steps">' +
        '<div class="step">在「快捷指令」App 里新建一个指令，第一步选「从图像中提取文本」（iOS 18 及以上，选你的截图或照片）。</div>' +
        '<div class="step">第二步用「匹配文本」把金额和商家挑出来，或者把整段文字当作 text 参数传过去。</div>' +
        '<div class="step">第三步添加「打开 URL」，粘贴上面的链接，把金额、名称换成刚才提取的变量。</div>' +
        '<div class="step">想彻底免确认就把链接里的 save 改成 1；想每次核对一遍就保持 save=0。</div>' +
        '<div class="step">还能把这个指令放进「共享」菜单或设置成轻点背面，付款截图一到手就记完。</div>' +
      "</div></div>";

    html += '<div class="card"><div class="card-head"><div><h3>粘贴一句话记账</h3><p>短信、支付通知、截图文字都能直接解析</p></div></div>' +
      '<textarea class="input" id="parseInput" placeholder="例如：今天 星巴克 32.00 元 银行卡支出 咖啡"></textarea>' +
      '<div class="row" style="gap:8px;margin-top:10px"><button class="btn primary" data-action="parse-text">解析并填写</button>' +
      '<span class="hint">解析结果会先出现在记账表单里，确认后再保存。</span></div></div>';

    html += '<div class="card"><div class="card-head"><div><h3>数据与备份</h3><p>数据只存在这台设备的浏览器里，不上传任何服务器</p></div></div>' +
      '<div class="kv small" style="margin-bottom:12px">' +
        '<span class="k">全部记录</span><span class="v num">' + total + " 笔</span>" +
        '<span class="k">带评价的记录</span><span class="v num">' + rated + " 笔</span>" +
        '<span class="k">快捷指令录入</span><span class="v num">' + su + " 笔</span>" +
        '<span class="k">自定义分类</span><span class="v num">' + state.categories.length + " 个</span>" +
      "</div>" +
      '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<button class="btn mini" data-action="export-data">导出备份 (JSON)</button>' +
        '<button class="btn mini" data-action="export-csv">导出表格 (CSV)</button>' +
        '<button class="btn mini" data-action="import-data">导入备份</button>' +
        '<button class="btn mini" data-action="demo-data">载入示例数据</button>' +
        '<button class="btn mini" data-action="clear-data" style="color:var(--expense)">清空记录</button>' +
      "</div></div>";

    var themes = [["auto", "跟随系统"], ["light", "浅色"], ["dark", "深色"]];
    html += '<div class="card"><div class="card-head"><div><h3>外观</h3><p>手机和电脑上都会自动适配</p></div></div>' +
      '<div class="seg">' + themes.map(function (t) {
        return '<button class="' + (state.settings.theme === t[0] ? "active" : "") + '" data-action="theme-set" data-theme="' + t[0] + '">' + t[1] + "</button>";
      }).join("") + "</div>" +
      '<div class="divider"></div>' +
      '<div class="hint">收入与支出分开统计，预算、评价、分类都可随时修改。想换设备就在旧设备导出备份，在新设备导入即可。</div></div>';
    return html;
  }

  /* ---------------- 记账表单 ---------------- */
  function emptyDraft(type) {
    var roots = rootsOf(type || "expense");
    return {
      id: null, type: type || "expense", amount: "", title: "", categoryId: roots.length ? roots[0].id : null,
      date: todayStr(), time: nowTime(), rating: null, reason: "", note: "", source: "manual"
    };
  }
  function renderEntry() {
    var d = draft;
    var isExp = d.type === "expense";
    var cur = cat(d.categoryId);
    if (!cur || cur.type !== d.type) {
      var roots0 = rootsOf(d.type);
      cur = roots0.length ? roots0[0] : null;
      d.categoryId = cur ? cur.id : null;
    }
    var parentId = cur ? (cur.parentId || cur.id) : null;
    var kids = parentId ? childrenOf(parentId) : [];
    var html = "";

    html += '<div class="field"><div class="seg ' + d.type + '">' +
      '<button class="' + (isExp ? "active" : "") + '" data-action="draft-type" data-type="expense">支出</button>' +
      '<button class="' + (!isExp ? "active" : "") + '" data-action="draft-type" data-type="income">收入</button>' +
      "</div></div>";

    html += '<div class="field"><label>金额</label><div class="amount-input"><span class="cur">¥</span>' +
      '<input id="dAmount" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00" value="' + esc(d.amount === "" ? "" : d.amount) + '" /></div></div>';

    html += '<div class="field"><label>名称 / 货物</label><input class="input" id="dTitle" placeholder="' + (isExp ? "例如 午餐、星巴克拿铁" : "例如 9 月工资") + '" value="' + esc(d.title) + '" /></div>';

    html += '<div class="field"><label>分类</label><div class="chips">' +
      rootsOf(d.type).map(function (c) {
        return '<button class="chip' + (c.id === parentId ? " active" : "") + '" data-action="draft-cat" data-id="' + c.id + '">' + c.icon + " " + esc(c.name) + "</button>";
      }).join("") + "</div>";
    if (kids.length) {
      html += '<div class="chips" style="margin-top:8px">' +
        '<button class="chip' + (cur && cur.id === parentId ? " active" : "") + '" data-action="draft-cat" data-id="' + parentId + '">整个' + esc(cat(parentId) ? cat(parentId).name : "") + "</button>" +
        kids.map(function (k) {
          return '<button class="chip' + (k.id === d.categoryId ? " active" : "") + '" data-action="draft-cat" data-id="' + k.id + '">' + k.icon + " " + esc(k.name) + "</button>";
        }).join("") + "</div>";
    }
    html += '<div class="hint" style="margin-top:7px">没有合适的分类？到「分类」里加一个，或直接改名字。</div></div>';

    html += '<div class="field"><label>日期与时间</label><div class="row" style="gap:8px">' +
      '<input class="input" type="date" id="dDate" value="' + d.date + '" />' +
      '<input class="input" type="time" id="dTime" value="' + d.time + '" style="width:132px;flex:0 0 auto" /></div>' +
      '<div class="chips" style="margin-top:8px">' +
        [["今天", 0], ["昨天", 1], ["前天", 2]].map(function (x) {
          var ds = shiftDate(todayStr(), -x[1]);
          return '<button class="chip' + (d.date === ds ? " active" : "") + '" data-action="draft-date" data-days="' + x[1] + '">' + x[0] + "</button>";
        }).join("") +
        '<button class="chip' + (d.date === todayStr().slice(0, 8) + "01" ? " active" : "") + '" data-action="draft-date" data-days="month1">本月 1 日</button>' +
      "</div></div>";

    if (isExp) {
      html += '<div class="field"><label>购物评价（可选）</label><div class="ratings">' +
        RATINGS.map(function (r) {
          return '<button class="rating' + (d.rating === r.id ? " active" : "") + '" data-r="' + r.id + '" data-action="draft-rating">' +
            '<span class="em">' + r.em + "</span>" + r.label + "</button>";
        }).join("") + "</div>" +
        (d.rating ? '<textarea class="input" id="dReason" style="margin-top:10px" placeholder="写点理由：为什么好 / 为什么不好？下次还要不要买？">' + esc(d.reason) + "</textarea>" : "") +
        "</div>";
    }

    html += '<div class="field"><label>备注（可选）</label><textarea class="input" id="dNote" placeholder="和谁、在哪、有没有优惠…">' + esc(d.note) + "</textarea></div>";

    if (d.source !== "manual") {
      html += '<div class="hint" style="margin-bottom:10px">来源：' + (d.source === "voice" ? "语音快记" : d.source === "shortcut" ? "快捷指令" : "文本解析") + "</div>";
    }
    html += '<button class="btn primary block" data-action="save-entry">' + (d.id ? "保存修改" : "保存这一笔") + "</button>";
    return html;
  }

  function syncDraft() {
    if (!draft) return;
    var a = document.getElementById("dAmount"), t = document.getElementById("dTitle");
    var dt = document.getElementById("dDate"), tm = document.getElementById("dTime");
    var r = document.getElementById("dReason"), n = document.getElementById("dNote");
    if (a) draft.amount = a.value.replace(/[^\d.]/g, "");
    if (t) draft.title = t.value;
    if (dt && dt.value) draft.date = dt.value;
    if (tm && tm.value) draft.time = tm.value;
    if (r) draft.reason = r.value;
    if (n) draft.note = n.value;
  }

  function openEntry(id) {
    if (id) {
      var t = state.transactions.filter(function (x) { return x.id === id; })[0];
      if (!t) return;
      draft = { id: t.id, type: t.type, amount: t.amount, title: t.title, categoryId: t.categoryId, date: t.date, time: t.time || nowTime(), rating: t.rating || null, reason: t.reason || "", note: t.note || "", source: t.source || "manual" };
      $("#sheetTitle").textContent = "修改记录";
      $("#deleteBtn").hidden = false;
    } else {
      draft = emptyDraft(view.tab === "records" && view.recType === "income" ? "income" : "expense");
      $("#sheetTitle").textContent = "记一笔";
      $("#deleteBtn").hidden = true;
    }
    $("#entryForm").innerHTML = renderEntry();
    openSheet("#sheet");
    setTimeout(function () { var a = document.getElementById("dAmount"); if (a) a.focus(); }, 120);
  }

  function saveEntry() {
    syncDraft();
    var amount = round2(parseFloat(draft.amount));
    if (!amount || amount <= 0) { toast("请先填写金额"); var a = document.getElementById("dAmount"); if (a) a.focus(); return; }
    var payload = {
      type: draft.type, amount: amount,
      title: (draft.title || "").trim() || (cat(draft.categoryId) ? cat(draft.categoryId).name : "未命名"),
      categoryId: draft.categoryId || ensureOther(draft.type),
      date: draft.date || todayStr(), time: draft.time || nowTime(),
      rating: draft.type === "expense" ? (draft.rating || null) : null,
      reason: draft.type === "expense" ? (draft.reason || "").trim() : "",
      note: (draft.note || "").trim(), source: draft.source || "manual"
    };
    if (draft.id) {
      var t = state.transactions.filter(function (x) { return x.id === draft.id; })[0];
      if (t) { Object.keys(payload).forEach(function (k) { t[k] = payload[k]; }); t.updatedAt = Date.now(); }
      toast("已更新这笔记录");
    } else {
      payload.id = uid();
      payload.createdAt = Date.now();
      state.transactions.push(payload);
      if (payload.date.slice(0, 7) !== view.month && view.tab === "overview") view.month = payload.date.slice(0, 7);
      toast("已记下 " + (payload.type === "income" ? "收入 " : "支出 ") + fmtMoney(amount));
    }
    save();
    closeSheet("#sheet");
    render();
  }

  function deleteEntry(id) {
    var t = state.transactions.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    if (!window.confirm("删除「" + (t.title || catLabel(t.categoryId)) + "」这笔记录？")) return;
    state.transactions = state.transactions.filter(function (x) { return x.id !== id; });
    save(); closeSheet("#sheet"); render(); toast("已删除");
  }

  /* ---------------- 语音快记 ---------------- */
  var voice = { listening: false, text: "", parsed: null };
  var recog = null;
  function speechSupported() { return !!(window.SpeechRecognition || window.webkitSpeechRecognition); }

  function renderVoice() {
    var html = "";
    html += '<div class="mic' + (voice.listening ? " listening" : "") + '" data-action="voice-toggle">🎙️</div>';
    html += '<div class="hint">' + (voice.listening ? "正在听…说完会自动停下" : "点一下开始，说「午餐 32 元 食堂」这样的一句话") + "</div>";
    html += '<div class="transcript" id="voiceText">' + (voice.text ? esc(voice.text) : '<span class="muted">识别到的文字会显示在这里</span>') + "</div>";
    html += '<div class="parsed" id="voiceParsed"></div>';
    html += '<div class="row" style="width:100%;gap:8px">' +
      '<button class="btn grow" data-action="voice-clear">清空</button>' +
      '<button class="btn primary grow" data-action="voice-fill"' + (voice.text ? "" : " disabled style=\"opacity:.5\"") + ">填入表单</button></div>";
    if (!speechSupported()) {
      html += '<div class="hint">这个浏览器不支持语音识别（Safari、Chrome 手机版支持）。下面直接打字也一样能自动解析。</div>';
    }
    html += '<textarea class="input" id="voiceType" placeholder="也可以打字：昨天买鞋 469 元 很舒服，强烈推荐"></textarea>' +
      '<button class="btn block" data-action="voice-parse-type">解析这句话</button>';
    return html;
  }
  function renderVoiceParsed() {
    var box = document.getElementById("voiceParsed");
    if (!box) return;
    var p = voice.parsed;
    if (!p) { box.innerHTML = ""; return; }
    var c = p.categoryId ? cat(p.categoryId) : null;
    var ri = ratingInfo(p.rating);
    box.innerHTML =
      cell("金额", p.amount ? fmtMoney(p.amount) : "未识别") +
      cell("名称", p.title || "未识别") +
      cell("分类", c ? c.icon + " " + catLabel(c.id) : "待选择") +
      cell("日期", dateHuman(p.date) + " " + p.date.slice(5)) +
      (ri ? cell("评价", ri.em + " " + ri.label) : "") +
      (p.reason ? cell("理由", p.reason) : "") +
      (p.note ? cell("备注", p.note) : "");
  }
  function cell(k, v) { return '<div class="cell"><div class="k">' + k + '</div><div class="v ellipsis">' + esc(v) + "</div></div>"; }

  function startVoice() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("这个浏览器不支持语音识别，可以改用打字解析"); return; }
    try { if (recog) recog.abort(); } catch (e) {}
    recog = new SR();
    recog.lang = "zh-CN";
    recog.interimResults = true;
    recog.continuous = false;
    recog.onstart = function () { voice.listening = true; refreshVoice(); };
    recog.onerror = function (ev) {
      voice.listening = false; refreshVoice();
      toast(ev.error === "not-allowed" ? "没有麦克风权限，请在浏览器设置里允许" : "没听清，再说一次试试");
    };
    recog.onend = function () {
      voice.listening = false;
      if (voice.text) { voice.parsed = parseText(voice.text); }
      refreshVoice();
    };
    recog.onresult = function (ev) {
      var txt = "";
      for (var i = 0; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
      voice.text = txt;
      voice.parsed = parseText(txt);
      var el = document.getElementById("voiceText");
      if (el) el.textContent = txt;
      renderVoiceParsed();
    };
    try { recog.start(); } catch (e) { toast("麦克风启动失败"); }
    voice.listening = true;
    refreshVoice();
  }
  function refreshVoice() { $("#voiceBody").innerHTML = renderVoice(); renderVoiceParsed(); }

  /* ---------------- 文本解析 ---------------- */
  function cnDate(text) {
    if (/今天|今日/.test(text)) return todayStr();
    if (/前天/.test(text)) return shiftDate(todayStr(), -2);
    if (/昨天|昨日/.test(text)) return shiftDate(todayStr(), -1);
    if (/大前天/.test(text)) return shiftDate(todayStr(), -3);
    var m = text.match(/(20\d{2})[-年\/.](\d{1,2})[-月\/.](\d{1,2})/);
    if (m) return m[1] + "-" + pad2(+m[2]) + "-" + pad2(+m[3]);
    m = text.match(/(\d{1,2})\s*[月\/](\d{1,2})\s*[日号]?/);
    if (m) {
      var y = new Date().getFullYear();
      return y + "-" + pad2(+m[1]) + "-" + pad2(+m[2]);
    }
    return todayStr();
  }
  function parseText(raw) {
    var text = String(raw || "").trim();
    var out = { type: "expense", amount: 0, title: "", categoryId: null, date: cnDate(text), rating: null, reason: "", note: "", source: "voice" };
    if (/收入|工资|发薪|奖金|报销|退款|红包收|到账|进账|收到/.test(text)) out.type = "income";

    /* 金额：优先带「元/块」的数字，其次取最大的数字 */
    var amount = 0, m = text.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:元|块钱|块|圆|人民币|rmb|RMB)/);
    if (m) amount = parseFloat(m[1].replace(",", "."));
    else {
      var nums = text.match(/\d+(?:[.,]\d{1,2})?/g) || [];
      nums.forEach(function (n) {
        var v = parseFloat(n.replace(",", "."));
        if (v > 0 && v < 10000000 && v > amount && !/^\d{4}$/.test(n)) amount = v;
      });
      if (!amount && nums.length) amount = parseFloat(nums[0].replace(",", "."));
    }
    out.amount = round2(amount);

    /* 评价 */
    if (/推荐|强烈推荐|回购|值得买/.test(text)) out.rating = "recommend";
    else if (/不好|差评|踩雷|失望|退货|后悔|别买/.test(text)) out.rating = "bad";
    else if (/一般|还行|凑合|普通|无感/.test(text)) out.rating = "ok";
    else if (/不错|很好|好评|满意|喜欢|好吃|好用/.test(text)) out.rating = "good";

    /* 分类 */
    var idx = buildKeywordIndex().filter(function (k) { return (cat(k.id) || {}).type === out.type || !cat(k.id); });
    var best = null;
    idx.forEach(function (k) {
      if (text.toLowerCase().indexOf(k.word) >= 0) {
        if (!best || k.word.length > best.word.length) best = k;
      }
    });
    if (best) out.categoryId = best.id;

    /* 理由 / 备注 */
    var rm = text.match(/(?:因为|理由|评价)[：:，,\s]*(.+)$/);
    if (rm) out.reason = rm[1].replace(/[。.]$/, "").trim();
    var nm = text.match(/(?:备注|另外)[：:，,\s]*(.+)$/);
    if (nm) out.note = nm[1].replace(/[。.]$/, "").trim();

    /* 名称：优先取「买 / 吃 / 喝」后面的物品，其次用去掉金额与评价后的文字 */
    var buyM = text.match(/(?:买了?|购入|下单了?|吃了?|喝了?|充了?|订了?|办了?)\s*([\u4e00-\u9fa5A-Za-z0-9]{1,12})/);
    var title = text;
    [/(?:今天|今日|昨天|昨日|前天|大前天)/g, /(20\d{2}[-年\/.]\d{1,2}[-月\/.]\d{1,2})/g, /\d{1,2}\s*[月\/]\d{1,2}\s*[日号]?/g,
     /(\d+(?:[.,]\d{1,2})?)\s*(?:元|块钱|块|圆|人民币|rmb|RMB)/gi, /\d+(?:[.,]\d{1,2})?(?=\s|$)/g,
     /(?:因为|理由|评价|备注|另外)[：:，,\s]*/g, /支出|消费|花了|花销|收入|到账|付款|支付|一共|合计|大约|大概|约/g,
     /推荐|强烈推荐|不错|很好|好评|满意|喜欢|好吃|好用|一般|还行|凑合|普通|不好|差评|踩雷|失望|退货|后悔|别买/g
    ].forEach(function (re) { title = title.replace(re, " "); });
    title = title.replace(/[，,。.、!！?？:：;；"'「」“”]/g, " ").replace(/\s+/g, " ").trim();
    var leftover = title;
    var item = buyM ? buyM[1].replace(/[。，,！!、].*$/, "") : "";
    title = item || leftover;
    if (title.length > 14) title = title.slice(0, 14);
    if (!out.reason && out.rating && item) {
      var guess = leftover.replace(item, " ").replace(/^(?:买了?|吃了?|喝了?|付了?|花了?|充了?)\s*/, " ").replace(/\s+/g, " ").trim();
      if (guess && guess.length >= 2 && guess.length <= 24) out.reason = guess;
    }
    out.title = title || (out.categoryId ? catLabel(out.categoryId) : (out.type === "income" ? "一笔收入" : "一笔支出"));
    return out;
  }

  function applyParsed(p, source) {
    draft = {
      id: null, type: p.type, amount: p.amount ? p.amount : "", title: p.title || "",
      categoryId: p.categoryId, date: p.date || todayStr(), time: nowTime(),
      rating: p.rating || null, reason: p.reason || "", note: p.note || "",
      source: source || p.source || "voice"
    };
    if (!draft.categoryId) {
      var roots = rootsOf(draft.type);
      draft.categoryId = roots.length ? roots[0].id : null;
    }
    $("#sheetTitle").textContent = "确认后保存";
    $("#deleteBtn").hidden = true;
    $("#entryForm").innerHTML = renderEntry();
    closeSheet("#voiceSheet");
    openSheet("#sheet");
  }

  /* ---------------- 弹层 / 提示 / 主题 ---------------- */
  var SHEETS = ["#sheet", "#voiceSheet", "#catSheet"];
  function openSheet(sel) {
    var el = $(sel);
    if (!el) return;
    el.hidden = false;
    $("#scrim").hidden = false;
  }
  function closeSheet(sel) {
    var el = $(sel);
    if (el) el.hidden = true;
    var any = SHEETS.filter(function (s) { var e = $(s); return e && !e.hidden; }).length;
    if (!any) $("#scrim").hidden = true;
  }
  function closeAllSheets() {
    SHEETS.forEach(function (s) { var e = $(s); if (e) e.hidden = true; });
    $("#scrim").hidden = true;
  }
  function toast(msg) {
    var wrap = $("#toasts");
    var el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = "opacity .3s, transform .3s";
      el.style.opacity = "0";
      el.style.transform = "translateY(6px)";
      setTimeout(function () { el.remove(); }, 320);
    }, 2100);
  }
  function applyTheme() {
    var th = (state && state.settings.theme) || "auto";
    document.documentElement.setAttribute("data-theme", th);
    var ico = document.querySelector("[data-theme-icon]");
    if (ico) ico.textContent = th === "dark" ? "🌙" : th === "light" ? "☀️" : "◐";
  }
  function openVoice() {
    voice.parsed = voice.text ? parseText(voice.text) : null;
    $("#voiceBody").innerHTML = renderVoice();
    renderVoiceParsed();
    openSheet("#voiceSheet");
  }
  function openCat(id, type, parentId) {
    if (id) {
      var c = cat(id);
      if (!c) return;
      catDraft = { id: c.id, type: c.type, name: c.name, icon: c.icon, color: c.color, parentId: c.parentId };
      $("#catSheetTitle").textContent = "编辑分类";
    } else {
      var parent = parentId ? cat(parentId) : null;
      catDraft = {
        id: null, type: type || view.catTab, name: "", parentId: parentId || null,
        icon: parent ? parent.icon : "🏷️", color: parent ? parent.color : COLORS[Math.floor(Math.random() * COLORS.length)]
      };
      $("#catSheetTitle").textContent = parent ? "新建子分类" : "新建分类";
    }
    $("#catForm").innerHTML = renderCatForm();
    openSheet("#catSheet");
    setTimeout(function () { var n = document.getElementById("catName"); if (n) n.focus(); }, 120);
  }
  function syncCatDraft() {
    var n = document.getElementById("catName");
    if (n) catDraft.name = n.value;
  }
  function saveCat() {
    syncCatDraft();
    var name = (catDraft.name || "").trim();
    if (!name) { toast("给分类起个名字吧"); return; }
    var dup = state.categories.filter(function (c) {
      return c.name === name && c.type === catDraft.type && c.parentId === catDraft.parentId && c.id !== catDraft.id;
    }).length;
    if (dup) { toast("同级已经有同名分类了"); return; }
    if (catDraft.id) {
      var c = cat(catDraft.id);
      if (c) { c.name = name; c.icon = catDraft.icon; c.color = catDraft.color; }
      /* 子分类默认继承父分类颜色 */
      childrenOf(catDraft.id).forEach(function (k) { k.color = catDraft.color; });
      toast("分类已更新");
    } else {
      state.categories.push({ id: uid(), type: catDraft.type, name: name, icon: catDraft.icon, color: catDraft.color, parentId: catDraft.parentId });
      toast("已新建分类「" + name + "」");
    }
    save();
    closeSheet("#catSheet");
    render();
  }
  function deleteCat(id) {
    var c = cat(id);
    if (!c) return;
    var kids = childrenOf(id);
    if (kids.length) { toast("请先删除它下面的 " + kids.length + " 个子分类"); return; }
    var n = usedCount(id);
    var fallback = ensureOther(c.type);
    if (n > 0 && !window.confirm("「" + c.name + "」下有 " + n + " 笔记录，删除后这些记录会移到「其他」。继续？")) return;
    if (n === 0 && !window.confirm("删除分类「" + c.name + "」？")) return;
    state.transactions.forEach(function (t) { if (t.categoryId === id) t.categoryId = fallback; });
    state.categories = state.categories.filter(function (x) { return x.id !== id; });
    delete state.budgets[id];
    save();
    closeSheet("#catSheet");
    render();
    toast("分类已删除");
  }

  /* ---------------- 快捷指令 / URL 导入 ---------------- */
  function tryJson(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function tryB64(s) {
    try {
      var bin = atob(String(s).replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/"));
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      var txt = new TextDecoder().decode(bytes);
      return tryJson(txt) || null;
    } catch (e) { return null; }
  }
  function readUrlPayload(search) {
    var q = search != null ? search : location.search;
    var hash = search != null ? "" : (location.hash || "").replace(/^#/, "");
    var params = new URLSearchParams(String(q || "").replace(/^\?/, ""));
    if (hash) {
      if (hash.indexOf("import=") === 0) {
        var raw = decodeURIComponent(hash.slice(7));
        var obj = tryJson(raw) || tryB64(raw);
        if (obj) return obj;
      } else if (hash.indexOf("amount=") >= 0 || hash.indexOf("text=") >= 0 || hash.indexOf("title=") >= 0) {
        new URLSearchParams(hash.replace(/^\?/, "")).forEach(function (v, k) { params.set(k, v); });
      } else {
        var o2 = tryJson(decodeURIComponent(hash)) || tryB64(hash);
        if (o2) return o2;
      }
    }
    var keys = ["amount", "title", "name", "merchant", "category", "sub", "date", "time", "type", "rating", "reason", "note", "text", "save", "source"];
    var out = {}, has = false;
    keys.forEach(function (k) { var v = params.get(k); if (v !== null && v !== "") { out[k] = v; has = true; } });
    return has ? out : null;
  }
  function resolveCategory(name, type) {
    if (!name) return null;
    var raw = String(name).trim();
    var parts = raw.split(/[·\/>\-|]/).map(function (s) { return s.trim(); }).filter(Boolean);
    var target = parts[parts.length - 1], parentName = parts.length > 1 ? parts[0] : null;
    var hit = null, i;
    for (i = 0; i < state.categories.length; i++) {
      var c = state.categories[i];
      if (c.type !== type) continue;
      if (c.name === target) {
        var p = c.parentId ? cat(c.parentId) : null;
        if (!parentName || (p && p.name === parentName)) hit = c;
      }
    }
    if (!hit) {
      var p2 = null;
      for (i = 0; i < state.categories.length; i++) {
        if (!state.categories[i].parentId && state.categories[i].type === type && state.categories[i].name === (parentName || target)) p2 = state.categories[i];
      }
      if (p2) hit = p2;
    }
    if (!hit) {
      var idx = buildKeywordIndex();
      for (i = 0; i < idx.length; i++) {
        var c2 = cat(idx[i].id);
        if (c2 && c2.type === type && raw.indexOf(idx[i].word) >= 0) { hit = c2; break; }
      }
    }
    return hit ? hit.id : null;
  }
  function normalizeRating(v) {
    if (!v) return null;
    var s = String(v).trim();
    var map = { "推荐": "recommend", "好": "good", "一般": "ok", "不好": "bad", "recommend": "recommend", "good": "good", "ok": "ok", "bad": "bad", "5": "recommend", "4": "good", "3": "ok", "2": "bad", "1": "bad" };
    return map[s] || null;
  }
  function buildPayload(p) {
    var type = String(p.type || "").toLowerCase() === "income" || /收入/.test(String(p.type || "")) ? "income" : "expense";
    var amount = round2(parseFloat(String(p.amount == null ? "" : p.amount).replace(/[^\d.\-]/g, "")));
    var date = /^\d{4}-\d{2}-\d{2}$/.test(String(p.date || "")) ? String(p.date) : cnDate(String(p.date || "今天"));
    var title = String(p.title || p.name || p.merchant || "").trim();
    var categoryId = resolveCategory(p.category || p.sub, type);
    return {
      type: type, amount: isNaN(amount) ? 0 : amount, title: title, categoryId: categoryId,
      date: date, time: String(p.time || "").match(/^\d{1,2}:\d{2}$/) ? String(p.time) : nowTime(),
      rating: type === "expense" ? normalizeRating(p.rating) : null,
      reason: String(p.reason || "").trim(), note: String(p.note || "").trim(),
      source: p.source === "voice" ? "voice" : "shortcut"
    };
  }
  function applyPayload(p, direct) {
    var textMode = p.text && !p.amount && !p.title && !p.name && !p.merchant;
    var d = textMode ? parseText(String(p.text)) : buildPayload(p);
    if (textMode) d.source = "shortcut";
    if (direct || String(p.save || "") === "1" || String(p.save || "").toLowerCase() === "true") {
      if (!d.amount) { toast("没能识别出金额，请手动补一下"); applyParsed(d, "shortcut"); return; }
      state.transactions.push({
        id: uid(), type: d.type, amount: d.amount,
        title: d.title || (d.categoryId ? catLabel(d.categoryId) : "快捷记账"),
        categoryId: d.categoryId || ensureOther(d.type),
        date: d.date || todayStr(), time: d.time || nowTime(),
        rating: d.rating || null, reason: d.reason || "", note: d.note || "",
        source: "shortcut", createdAt: Date.now()
      });
      save();
      if (viewsNeeded()) render();
      toast("快捷指令已记下 " + (d.type === "income" ? "收入 " : "支出 ") + fmtMoney(d.amount));
      return;
    }
    applyParsed(d, "shortcut");
    toast("来自快捷指令，确认一下就能保存");
  }
  function viewsNeeded() { return true; }
  function cleanUrl() {
    try { history.replaceState(null, "", location.pathname + location.hash.replace(/([#?])(import|amount|title|text)=[\s\S]*$/, "")); }
    catch (e) { /* file:// 下忽略 */ }
  }

  /* ---------------- 数据导入导出 ---------------- */
  function download(name, text, mime) {
    try {
      var blob = new Blob([text], { type: mime || "application/octet-stream" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 800);
      toast("已导出 " + name);
    } catch (e) { toast("导出失败，请换一个浏览器试试"); }
  }
  function exportJson() {
    download("小账本备份-" + todayStr() + ".json", JSON.stringify(state, null, 2), "application/json");
  }
  function exportCsv() {
    var head = ["日期", "时间", "类型", "一级分类", "子分类", "名称", "金额", "评价", "评价理由", "备注", "来源"];
    var rows = state.transactions.slice().sort(function (a, b) { return (a.date + a.time).localeCompare(b.date + b.time); }).map(function (t) {
      var c = cat(t.categoryId), r = rootOf(t.categoryId), ri = ratingInfo(t.rating);
      return [t.date, t.time || "", typeLabel(t.type), r ? r.name : "", c && c.parentId ? c.name : "", t.title || "", t.type === "income" ? t.amount : -t.amount,
        ri ? ri.label : "", t.reason || "", t.note || "", t.source === "voice" ? "语音" : t.source === "shortcut" ? "快捷指令" : "手动"]
        .map(function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; }).join(",");
    });
    download("小账本-" + todayStr() + ".csv", "\ufeff" + [head.join(",")].concat(rows).join("\r\n"), "text/csv;charset=utf-8");
  }
  function importJson() {
    var input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.onchange = function () {
      var f = input.files && input.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        var obj = tryJson(String(fr.result));
        if (!obj || !obj.categories || !obj.transactions) { toast("这个文件看起来不是小账本备份"); return; }
        if (!window.confirm("导入会覆盖当前数据（共 " + state.transactions.length + " 笔），继续？")) return;
        state = obj;
        state.settings = state.settings || { theme: "auto", monthlyBudget: 0 };
        state.budgets = state.budgets || {};
        save(); applyTheme(); render();
        toast("导入完成，共 " + state.transactions.length + " 笔记录");
      };
      fr.readAsText(f);
    };
    input.click();
  }

  /* ---------------- 事件 ---------------- */
  function onClick(e) {
    var el = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!el) return;
    var a = el.getAttribute("data-action");
    var d = el.dataset;
    switch (a) {
      case "tab": go(d.tab); break;
      case "open-entry": openEntry(); break;
      case "edit-entry": openEntry(d.id); break;
      case "close-sheet": closeSheet("#sheet"); break;
      case "save-entry": saveEntry(); break;
      case "delete-entry": if (draft && draft.id) deleteEntry(draft.id); break;
      case "open-voice": openVoice(); break;
      case "close-voice": try { if (recog) recog.abort(); } catch (err) {} voice.listening = false; closeSheet("#voiceSheet"); break;
      case "voice-toggle": voice.listening ? (function () { try { recog.stop(); } catch (err) {} })() : startVoice(); break;
      case "voice-clear": voice.text = ""; voice.parsed = null; refreshVoice(); break;
      case "voice-fill": if (voice.parsed) applyParsed(voice.parsed, "voice"); break;
      case "voice-parse-type": (function () {
        var ta = document.getElementById("voiceType");
        var txt = ta ? ta.value : "";
        if (!txt.trim()) { toast("先说一句话或打一行字"); return; }
        voice.text = txt.trim();
        voice.parsed = parseText(voice.text);
        refreshVoice();
      })(); break;
      case "month-move": view.month = shiftMonth(view.month, +d.n); render(); break;
      case "month-now": view.month = thisMonth(); render(); break;
      case "rec-type": view.recType = d.type; render(); break;
      case "draft-type": syncDraft(); draft.type = d.type;
        if (!cat(draft.categoryId) || cat(draft.categoryId).type !== d.type) {
          var rr = rootsOf(d.type); draft.categoryId = rr.length ? rr[0].id : null;
        }
        if (d.type === "income") { draft.rating = null; draft.reason = ""; }
        $("#entryForm").innerHTML = renderEntry(); break;
      case "draft-cat": syncDraft(); draft.categoryId = d.id; $("#entryForm").innerHTML = renderEntry(); break;
      case "draft-rating": syncDraft(); draft.rating = (draft.rating === d.r ? null : d.r); $("#entryForm").innerHTML = renderEntry(); break;
      case "draft-date": syncDraft();
        draft.date = d.days === "month1" ? draft.date.slice(0, 8) + "01" : shiftDate(todayStr(), -(+d.days));
        $("#entryForm").innerHTML = renderEntry(); break;
      case "cat-tab": view.catTab = d.type; render(); break;
      case "cat-edit": openCat(d.id); break;
      case "cat-add": openCat(null, d.type, d.parent || null); break;
      case "close-cat": closeSheet("#catSheet"); break;
      case "cat-save": saveCat(); break;
      case "cat-del": deleteCat(d.id); break;
      case "icon-pick": syncCatDraft(); catDraft.icon = d.icon; $("#catForm").innerHTML = renderCatForm(); break;
      case "color-pick": syncCatDraft(); catDraft.color = d.color; $("#catForm").innerHTML = renderCatForm(); break;
      case "budget-save-total": (function () {
        var inp = document.querySelector('[data-budget="total"]');
        state.settings.monthlyBudget = Math.max(0, round2(parseFloat(inp && inp.value) || 0));
        save(); render(); toast(state.settings.monthlyBudget > 0 ? "月度预算已设为 " + fmtMoney(state.settings.monthlyBudget) : "已取消月度预算");
      })(); break;
      case "theme-set": state.settings.theme = d.theme; save(); applyTheme(); render(); break;
      case "theme-toggle": (function () {
        var order = ["auto", "light", "dark"];
        var i = order.indexOf(state.settings.theme);
        state.settings.theme = order[(i + 1) % 3];
        save(); applyTheme(); render();
        toast("外观：" + ({ auto: "跟随系统", light: "浅色", dark: "深色" })[state.settings.theme]);
      })(); break;
      case "copy-url": copyText($("#shortcutUrl") ? $("#shortcutUrl").textContent : ""); break;
      case "copy-text": copyText(d.copy || ""); break;
      case "test-shortcut": (function () {
        var payload = readUrlPayload("?amount=19.9&title=瑞幸生椰拿铁&category=咖啡奶茶&type=expense&rating=recommend&reason=好喝&save=0");
        if (payload) applyPayload(payload, false);
      })(); break;
      case "parse-text": (function () {
        var ta = document.getElementById("parseInput");
        var txt = ta ? ta.value : "";
        if (!txt.trim()) { toast("先粘一段文字进来"); return; }
        applyParsed(parseText(txt), "text");
      })(); break;
      case "export-data": exportJson(); break;
      case "export-csv": exportCsv(); break;
      case "import-data": importJson(); break;
      case "demo-data":
        if (!window.confirm("载入示例数据会替换现有记录，继续？")) break;
        state.transactions = demoTransactions(state.categories);
        save(); render(); toast("示例数据已载入");
        break;
      case "clear-data":
        if (!window.confirm("清空全部 " + state.transactions.length + " 笔记录？分类和预算会保留。")) break;
        state.transactions = [];
        save(); render(); toast("记录已清空");
        break;
    }
  }
  function copyText(text) {
    if (!text) return;
    var done = function () { toast("已复制到剪贴板"); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      done();
    } catch (e) { toast("复制失败，请长按链接手动复制"); }
  }
  function onInput(e) {
    var t = e.target;
    if (t && t.id === "recQ") { view.recQ = t.value; renderRecordsList(); }
  }
  function onChange(e) {
    var t = e.target;
    if (!t) return;
    if (t.id === "recMonth") { view.month = t.value || thisMonth(); renderRecordsList(); return; }
    if (t.id === "dDate" || t.id === "dTime") { syncDraft(); return; }
    if (t.dataset && t.dataset.budget) {
      var v = Math.max(0, round2(parseFloat(t.value) || 0));
      if (t.dataset.budget === "total") {
        state.settings.monthlyBudget = v;
        save(); render();
        toast(v > 0 ? "月度预算已设为 " + fmtMoney(v) : "已取消月度预算");
      } else {
        if (v > 0) state.budgets[t.dataset.budget] = v; else delete state.budgets[t.dataset.budget];
        save(); render();
      }
    }
  }
  function onKey(e) {
    if (e.key === "Escape") { closeAllSheets(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      var sheet = $("#sheet");
      if (sheet && !sheet.hidden) { e.preventDefault(); saveEntry(); }
    }
  }

  /* 视图渲染表 */
  var renderers = { overview: renderOverview, records: renderRecords, budget: renderBudget, categories: renderCategories, more: renderMore };

  /* ---------------- 启动 ---------------- */
  var FIRST_RUN = false;
  function init() {
    state = load();
    if (!state) { state = defaultState(true); save(); FIRST_RUN = true; }
    applyTheme();
    document.addEventListener("click", onClick);
    document.addEventListener("input", onInput);
    document.addEventListener("change", onChange);
    document.addEventListener("keydown", onKey);
    var sc = $("#scrim");
    if (sc) sc.addEventListener("click", closeAllSheets);
    var payload = readUrlPayload();
    render();
    if (payload) { cleanUrl(); applyPayload(payload, false); }
    if (FIRST_RUN) setTimeout(function () { toast("已放入几条示例数据，去「更多」里可以清空"); }, 700);
    if ("serviceWorker" in navigator && location.protocol !== "file:") {
      navigator.serviceWorker.register("sw.js").catch(function () {});
    }
  }

  /* 明细页的列表在渲染后填充 */
  var baseRender = render;
  render = function () {
    baseRender.apply(null, arguments);
    if (view.tab === "records" && document.getElementById("recordsList")) renderRecordsList();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
