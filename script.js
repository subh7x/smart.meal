const $=id=>document.getElementById(id);

const STORAGE={
  profile:"smartmeal_profile_v8",
  plan:"smartmeal_plan_v8",
  grocery:"smartmeal_grocery_v8",
  checked:"smartmeal_grocery_checked_v8",
  theme:"smartmeal_theme_v8"
};

const fieldIds=[
  "age","gender","height","weight","goal","dietary-preference","regional-cuisine",
  "likes","allergies","health-conditions","activity","workout-schedule","budget",
  "meals-per-day","cooking-time"
];

const mealBank={
  "North Indian":{
    breakfast:["Vegetable poha + curd","Besan chilla + mint chutney","Vegetable paratha + curd","Moong dal cheela + chutney","Oats upma + fruit","Paneer bhurji toast","Vegetable daliya + curd"],
    lunch:["Dal + 2 roti + cucumber salad","Rajma + brown rice + salad","Chole + 2 roti + salad","Moong dal khichdi + raita","Palak paneer + 2 roti","Dal tadka + jeera rice + salad","Kadhi + rice + salad"],
    dinner:["Paneer tikka + roti + salad","Mixed veg + dal + roti","Lauki chana dal + roti","Vegetable pulao + raita","Soya chunk curry + roti","Dal + mixed vegetables + roti","Matar paneer + roti"],
    snack:["Fruit + roasted chana","Buttermilk + makhana","Apple + nuts","Sprouts chaat","Guava + roasted chana"],
    nonVegBreakfast:["Masala omelette + whole-wheat toast","Egg bhurji + roti","Boiled eggs + vegetable poha","Chicken keema toast"],
    nonVegLunch:["Chicken curry + 2 roti + salad","Chicken biryani + raita + salad","Chicken tikka + jeera rice + salad","Egg curry + 2 roti + salad","Fish curry + rice + salad"],
    nonVegDinner:["Tandoori chicken + roti + salad","Chicken tikka + vegetable soup","Chicken curry + roti + salad","Fish tikka + sautéed vegetables","Egg bhurji + roti + salad"]
  },
  "South Indian":{
    breakfast:["Idli + sambar","Vegetable dosa + sambar","Vegetable upma + coconut chutney","Pesarattu + chutney","Oats idli + sambar","Ven pongal + sambar","Ragi dosa + sambar"],
    lunch:["Sambar rice + poriyal","Curd rice + vegetable curry","Rasam + rice + beans poriyal","Lemon rice + dal + salad","Vegetable sambar + brown rice","Tomato rice + dal + salad","Khichdi + vegetable poriyal"],
    dinner:["Vegetable uttapam + sambar","Ragi dosa + vegetable curry","Paneer/soya stir-fry + rice","Sambar + 2 dosa","Vegetable soup + idli","Dal + rice + poriyal","Curd rice + vegetables"],
    snack:["Fruit + peanuts","Buttermilk + roasted chana","Sundal","Coconut water + nuts","Fruit bowl"],
    nonVegBreakfast:["Egg dosa + chutney","Egg bhurji + dosa","Masala omelette + idli","Chicken keema dosa"],
    nonVegLunch:["Chicken biryani + raita","Fish curry + rice + poriyal","Chicken chettinad + rice + salad","Egg curry + rice + vegetables","Pepper chicken + lemon rice"],
    nonVegDinner:["Grilled chicken + dosa","Fish curry + appam","Chicken soup + idli","Egg dosa + sambar","Pepper chicken + vegetable poriyal"]
  },
  "Generic Indian":{
    breakfast:["Vegetable oats + fruit","Moong dal chilla + chutney","Poha + curd","Idli + sambar","Besan chilla + fruit","Vegetable upma + curd","Daliya + nuts"],
    lunch:["Dal + rice + salad","Chole + roti + salad","Rajma + rice + vegetables","Khichdi + curd","Paneer curry + roti","Dal + vegetable pulao","Sambar + rice + salad"],
    dinner:["Mixed vegetable curry + roti","Paneer/tofu tikka + salad","Dal + roti + vegetables","Vegetable khichdi + raita","Soya curry + roti","Soup + paneer/tofu + roti","Dal + rice + salad"],
    snack:["Fruit + roasted chana","Makhana","Sprouts chaat","Buttermilk + nuts","Fruit + seeds"],
    nonVegBreakfast:["Masala omelette + toast","Egg bhurji + roti","Boiled eggs + poha","Chicken keema sandwich"],
    nonVegLunch:["Chicken curry + rice + salad","Chicken tikka + roti + salad","Egg curry + rice + vegetables","Fish curry + roti + salad","Chicken biryani + raita"],
    nonVegDinner:["Grilled chicken + roti + salad","Chicken curry + roti + vegetables","Fish tikka + rice + salad","Egg bhurji + roti + salad","Chicken soup + vegetable sandwich"]
  }
};

function init(){
  loadSavedState();
  $("user-form").addEventListener("submit",e=>{e.preventDefault();generateMealPlan()});
  $("theme-toggle").addEventListener("click",toggleTheme);
  $("reset-grocery-list").addEventListener("click",resetGroceryList);
  $("restart-btn").addEventListener("click",restartApp);
  $("restart-form-btn").addEventListener("click",restartApp);
}

function getProfile(){
  const p={};
  fieldIds.forEach(id=>{
    const e=$(id);
    p[id]=e.type==="number"?Number(e.value):e.value;
  });
  return p;
}

function valid(p){
  return p.age>=13&&p.age<=100&&p.height>=100&&p.height<=250&&p.weight>=25&&p.weight<=300;
}

function nutrition(p){
  const bmr=p.gender==="Male"
    ?10*p.weight+6.25*p.height-5*p.age+5
    :10*p.weight+6.25*p.height-5*p.age-161;
  const af={Low:1.2,Moderate:1.45,High:1.65}[p.activity]||1.2;
  let calories=bmr*af;
  if(p.goal==="Weight Loss")calories-=350;
  if(p.goal==="Weight Gain")calories+=300;
  if(p.goal==="Muscle Gain")calories+=200;
  calories=Math.max(1200,Math.round(calories));
  const protein=p.goal==="Muscle Gain"?p.weight*1.6:p.goal==="Weight Loss"?p.weight*1.3:p.weight*1.1;
  const bmi=p.weight/Math.pow(p.height/100,2);
  return{calories,protein:Math.round(protein),bmi:bmi.toFixed(1)};
}

function filter(m,p){
  const t=m.toLowerCase();
  const a=(p.allergies||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);
  if(a.some(x=>x&&t.includes(x)))return false;

  const d=p["dietary-preference"];
  if(d==="Vegan" && /(curd|paneer|chicken|egg|raita|buttermilk|ghee|milk|cheese|yogurt|fish)/i.test(m))return false;
  if(d==="Jain" && /(onion|garlic|potato|carrot|radish|egg|chicken|fish)/i.test(m))return false;
  if(d==="Eggitarian" && /chicken|fish/i.test(m))return false;
  if(d==="Pure Veg" && /chicken|fish|egg/i.test(m))return false;
  return true;
}

function choose(list,p,used){
  const f=list.filter(m=>filter(m,p));
  const likes=(p.likes||"").toLowerCase().split(",").map(x=>x.trim()).filter(Boolean);
  const l=f.filter(m=>likes.some(x=>x&&m.toLowerCase().includes(x)));
  const pool=l.length?l:(f.length?f:list);
  let av=pool.filter(m=>!used.has(m));
  if(!av.length)av=pool;
  const m=av[Math.floor(Math.random()*av.length)];
  used.add(m);
  return m;
}

function createPlan(p){
  const c=mealBank[p["regional-cuisine"]]||mealBank["Generic Indian"];
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const n=Number(p["meals-per-day"]);
  const diet=p["dietary-preference"];
  const used=new Set();

  return days.map((day,idx)=>{
    let breakfast,lunch,dinner;
    const useNonVeg=diet==="Non-Veg";
    const useEgg=diet==="Eggitarian";

    if(useNonVeg){
      breakfast=choose(c.nonVegBreakfast,p,used);
      lunch=choose(c.nonVegLunch,p,used);
      dinner=choose(c.nonVegDinner,p,used);
    }else if(useEgg && idx%2===0){
      breakfast=choose(c.nonVegBreakfast.filter(x=>/egg/i.test(x)),p,used);
      lunch=choose(c.lunch,p,used);
      dinner=choose(c.dinner,p,used);
    }else{
      breakfast=choose(c.breakfast,p,used);
      lunch=choose(c.lunch,p,used);
      dinner=choose(c.dinner,p,used);
    }

    const meals=[
      {time:"Breakfast",name:breakfast},
      {time:"Lunch",name:lunch},
      {time:"Dinner",name:dinner}
    ];

    if(n>=4)meals.splice(2,0,{time:"Snack",name:choose(c.snack,p,used)});
    if(n>=5)meals.push({time:"Evening Snack",name:choose(c.snack,p,used)});
    if(n>=6)meals.splice(3,0,{time:"Mini Meal",name:choose(c.snack,p,used)});

    return{day,meals};
  });
}

function esc(v){
  return String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function renderNutrition(n,p){
  $("calories").textContent=`${n.calories} kcal`;
  $("protein").textContent=`${n.protein} g`;
  $("bmi").textContent=n.bmi;
  $("goal-label").textContent=p.goal;
  $("nutrition-note").textContent="General estimates only. Individual needs vary.";
  $("nutrition-summary").classList.remove("hidden");
}

function renderPlan(plan,p){
  $("days").innerHTML=plan.map((d,i)=>`
    <article class="day-card">
      <div class="day-title"><span>Day ${i+1} · ${esc(d.day)}</span><span>${p["dietary-preference"]==="Non-Veg"?"🍗":"🥗"}</span></div>
      ${d.meals.map(m=>`
        <div class="meal">
          <div class="meal-top"><span class="meal-name">${esc(m.name)}</span><span class="meal-time">${esc(m.time)}</span></div>
          <p class="meal-desc">Balanced portion • Indian-style • Adjust salt/oil to preference</p>
        </div>`).join("")}
    </article>`).join("");
  $("meal-plan-note").textContent=`${p["dietary-preference"]} • ${p["regional-cuisine"]} • ${p["meals-per-day"]} meals/day`;
  $("meal-plan").classList.remove("hidden");
}

function renderMacros(n){
  const a=[
    ["Calories",n.calories,"kcal",100],
    ["Protein",n.protein,"g",70],
    ["Carbs",Math.round(n.calories*.45/4),"g",55],
    ["Fat",Math.round(n.calories*.30/9),"g",30]
  ];
  $("macros").innerHTML=a.map(x=>`
    <div class="macro-row">
      <strong>${x[0]}</strong>
      <div class="macro-bar"><div class="macro-fill" style="width:${x[3]}%"></div></div>
      <span>${x[1]} ${x[2]}</span>
    </div>`).join("");
  $("daily-summary").classList.remove("hidden");
}

function groceries(plan){
  const t=plan.flatMap(d=>d.meals.map(m=>m.name.toLowerCase())).join(" ");
  const cats={
    "🥬 Vegetables":["onion","tomato","spinach","palak","lauki","beans","vegetable","cucumber","lemon","mint","poriyal","carrot"],
    "🌾 Grains & Staples":["rice","roti","poha","oats","daliya","idli","dosa","upma","ragi","pulao","toast","bread","appam"],
    "🥛 Dairy & Alternatives":["curd","paneer","raita","buttermilk","tofu","milk","cheese"],
    "💪 Protein":["dal","rajma","chole","chana","moong","soya","sprouts","egg","chicken","fish","keema"],
    "🍎 Fruits & Snacks":["fruit","apple","guava","banana","makhana","nuts","peanuts","seeds","coconut"]
  };
  const g={};
  Object.keys(cats).forEach(c=>g[c]=[]);
  g["🧂 Pantry"]=["Cooking oil","Salt & spices","Ginger","Green chilli"];
  Object.entries(cats).forEach(([c,ks])=>ks.forEach(k=>{if(t.includes(k))g[c].push(k)}));
  Object.keys(g).forEach(c=>g[c]=[...new Set(g[c])].sort().map(x=>x.charAt(0).toUpperCase()+x.slice(1)));
  localStorage.setItem(STORAGE.grocery,JSON.stringify(g));
  renderGroceries(g);
}

function renderGroceries(g){
  const checked=JSON.parse(localStorage.getItem(STORAGE.checked)||"{}");
  $("grocery-category").innerHTML=Object.entries(g).map(([c,items])=>`
    <div class="grocery-category">
      <h3>${esc(c)}</h3>
      ${items.map(i=>{
        const k=c+"_"+i;
        return `<label class="grocery-item ${checked[k]?"done":""}">
          <input type="checkbox" data-grocery="${esc(k)}" ${checked[k]?"checked":""}>
          <span>${esc(i)}</span>
        </label>`;
      }).join("")}
    </div>`).join("");

  document.querySelectorAll("[data-grocery]").forEach(cb=>cb.addEventListener("change",()=>{
    const d=JSON.parse(localStorage.getItem(STORAGE.checked)||"{}");
    d[cb.dataset.grocery]=cb.checked;
    localStorage.setItem(STORAGE.checked,JSON.stringify(d));
    cb.parentElement.classList.toggle("done",cb.checked);
  }));

  $("grocery-checklist").classList.remove("hidden");
}

function generateMealPlan(){
  const p=getProfile();
  if(!valid(p)){
    $("error-message").textContent="Please enter valid age, height and weight.";
    return;
  }
  $("error-message").textContent="";
  const n=nutrition(p);
  const plan=createPlan(p);
  renderNutrition(n,p);
  renderMacros(n);
  renderPlan(plan,p);
  groceries(plan);
  localStorage.setItem(STORAGE.profile,JSON.stringify(p));
  localStorage.setItem(STORAGE.plan,JSON.stringify(plan));
  setTimeout(()=>$("nutrition-summary").scrollIntoView({behavior:"smooth",block:"start"}),50);
}

function resetGroceryList(){
  localStorage.removeItem(STORAGE.checked);
  const g=JSON.parse(localStorage.getItem(STORAGE.grocery)||"{}");
  if(Object.keys(g).length)renderGroceries(g);
}

function restartApp(){
  const keys=Object.values(STORAGE);
  keys.forEach(k=>localStorage.removeItem(k));
  $("user-form").reset();
  ["nutrition-summary","daily-summary","meal-plan","grocery-checklist"].forEach(id=>$(id).classList.add("hidden"));
  $("error-message").textContent="";
  window.scrollTo({top:0,behavior:"smooth"});
}

function toggleTheme(){
  const dark=document.body.classList.toggle("dark");
  $("theme-toggle").textContent=dark?"☀️":"🌙";
  localStorage.setItem(STORAGE.theme,dark?"dark":"light");
}

function loadSavedState(){
  if(localStorage.getItem(STORAGE.theme)==="dark"){
    document.body.classList.add("dark");
    $("theme-toggle").textContent="☀️";
  }
  const p=JSON.parse(localStorage.getItem(STORAGE.profile)||"null");
  if(p)fieldIds.forEach(id=>{
    if($(id)&&p[id]!==undefined)$(id).value=p[id];
  });
  const plan=JSON.parse(localStorage.getItem(STORAGE.plan)||"null");
  if(p&&plan){
    const n=nutrition(p);
    renderNutrition(n,p);
    renderMacros(n);
    renderPlan(plan,p);
    const g=JSON.parse(localStorage.getItem(STORAGE.grocery)||"null");
    g?renderGroceries(g):groceries(plan);
  }
}

document.addEventListener("DOMContentLoaded",init);


if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));}
