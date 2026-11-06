const fs=require('fs'),vm=require('vm'),assert=require('assert');
const seed={study_folders:JSON.stringify([{id:'old',name:'Englisch'}]),study_cards:JSON.stringify([{front:'Hello',back:'Hallo',folder:'old'},{front:'Alt',back:'Antwort',folder:''}]),study_mc_progress_v1:JSON.stringify({'0-0':{correct:true,attempts:1}})};
function setup(saved={...seed}){const app={innerHTML:''};const theme={};const ctx=vm.createContext({console,document:{querySelector:s=>s==='#app'?app:s==='#theme'?theme:null,querySelectorAll:()=>[],body:{classList:{add(){},toggle(){}}}},localStorage:{getItem:k=>saved[k]??null,setItem:(k,v)=>saved[k]=v},window:{scrollTo(){}},confirm:()=>true});vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8').split('<script>')[1].split('</script>')[0],ctx);return {run:s=>vm.runInContext(s,ctx),app,saved}}
let {run,app,saved}=setup();
assert(app.innerHTML.includes('Meine Lernordner'));assert(app.innerHTML.includes('BWL'));assert(app.innerHTML.includes('Englisch'));assert(app.innerHTML.includes('Ohne Ordner'));assert(!app.innerHTML.includes('BWL üben'));assert(!app.innerHTML.includes('BWL – Grundlagen'));
run("openFolder('bwl')");assert.equal(run('folderQuestions().length'),85);assert.equal(run('questionStats().correct'),1);assert.equal(run('allCards().length'),17);run("startPractice('all')");assert.equal(run('practice.queue.length'),85);run("startPractice('0')");assert.equal(run('practice.queue.length'),5);
run('practice.choice=MC[practice.queue[0]].answer;checkPractice();checkPractice()');assert.equal(run('practice.results.length'),1);
run("openFolder('old')");assert.equal(run('allCards().length'),1);assert.equal(run('folderQuestions().length'),0);assert(app.innerHTML.includes('erste Aufgabe'));run("nav('quiz')");assert(app.innerHTML.includes('noch keine Aufgaben'));
assert(!run("addQuestion('Test',['gleich','gleich','anders'],0)"));assert(run("addQuestion('What is a dog?',['Katze','Hund','Vogel'],1,'Dog bedeutet Hund.')"));assert(run("addQuestion('Two?',['1','2','3'],1)"));
run("startPractice('all')");assert.equal(run('practice.queue.length'),2);assert(!app.innerHTML.includes('BWL'));run('practice.choice=(MC[practice.queue[0]].answer+1)%3;checkPractice()');assert(!app.innerHTML.includes('Kapitel-Erklärung'));assert.equal(run('questionStats().wrong'),1);
run('nextPractice();practice.choice=MC[practice.queue[practice.index]].answer;checkPractice();nextPractice()');assert(app.innerHTML.includes('1 von 2 richtig'));run("startPractice('wrong')");assert.equal(run('practice.queue.length'),1);run('practice.choice=MC[practice.queue[0]].answer;checkPractice();nextPractice()');assert.equal(run('questionStats().correct'),2);
const reload=setup(saved);reload.run("openFolder('old')");assert.equal(reload.run('folderQuestions().length'),2);assert.equal(reload.run('questionStats().correct'),2);
run("openFolder('')");assert.equal(run('allCards().length'),1);run("openFolder('bwl')");for(const view of ['folder','topics','lesson','cards','quiz','fill','label','sources']){run(`nav('${view}')`);assert(app.innerHTML.length>0)}
run("openFolder('old');removeCustomFolder('old')");assert.equal(run('custom.length'),0);assert.equal(run('customQuestions.length'),0);assert.equal(run('MC.length'),85);assert.equal(run('customCards.length'),1);assert(run("mcProgress['0-0'].correct"));assert(app.innerHTML.includes('Meine Lernordner'));
run("nav('quiz')");assert.equal(run('state.view'),'home');
console.log('OK: neutrale Startseite, BWL-Inhalte, Altbestand, getrennte Ordner/Karten/Aufgaben, eigene MC-Fragen, Auswertung, Fehlerwiederholung, Neuladen und gezieltes Löschen.');

// Verify question structure and independent arithmetic against the saved answer key.
const data=run('DATA');assert.equal(data.topics.length,17);assert.equal(data.quiz.length,85);
assert.equal(new Set(data.quiz.map(q=>q.id)).size,85);
for(let topic=0;topic<17;topic++){assert.equal(data.quiz.filter(q=>q.topic===topic).length,5);assert(data.topics[topic].simple.length>50)}
for(const q of data.quiz){assert.equal(q.options.length,3);assert.equal(new Set(q.options).size,3);assert(q.options[q.answer]);assert(q.why)}
const calculations={
 '0-3':100*.8-55,'2-1':12000/120000*100,'2-2':40000/100000*100,
 '4-1':40000-14000-16000-5000,'5-1':-12000+2000,
 '6-0':9000-4000,'6-1':18000-(9000-1000),'6-2':18000+(-8000),
 '7-1':25000-7000+5000,'9-1':20000+10000+5000,'9-2':35000-12000,
 '13-1':100000-30000-40000-10000-5000,'14-1':12000/4,'14-2':12000-2*(12000/4),'15-2':1500-1000
};
for(const [id,result] of Object.entries(calculations)){const q=data.quiz.find(q=>q.id===id);const numeric=Number(q.options[q.answer].replaceAll('−','-').replaceAll('.','').replace(/[^0-9+-]/g,''));assert.equal(numeric,result,id)}
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');assert(!/ai-panel|local-ai|ai-worker|puter|webllm/i.test(html));assert(!/<script[^>]+src=/i.test(html));
console.log('OK: 17 Kapitel, 85 Fragen, Antwortstruktur, 15 Rechenaufgaben und vollständig eigenständige HTML-Datei ohne KI.');
