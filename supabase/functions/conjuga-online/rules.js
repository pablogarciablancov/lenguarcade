// Rules preserved from Conjuga y apuesta. Server never accepts a client question or score.
  const TIERS={
    basic:{label:'Básico',mult:1,desc:'Formas frecuentes',color:'#23a66a'},
    medium:{label:'Intermedio',mult:1.35,desc:'Irregularidades y compuestos',color:'#1fb7c9'},
    advanced:{label:'Avanzado',mult:1.7,desc:'Subjuntivo e imperativo',color:'#6f5cff'},
    expert:{label:'Experto',mult:2.1,desc:'Formas avanzadas',color:'#d74b57'}
  };
  const IRREGULAR=new Set(['ser','estar','ir','haber','tener','hacer','decir','venir','poner','salir','poder','querer','saber','caber','andar','traer','conducir','traducir','dormir','morir','pedir','seguir','conseguir','sentir','mentir','preferir','reír','sonreír','ver','dar','oír','huir','construir','medir','elegir','corregir','divertir','advertir','servir','vestir','jugar','freír','prever']);

  const QUESTION_BANK=[
      {verbo:"romper",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"2ª plural",respuesta:"vosotros habéis roto"},
      {verbo:"mentir",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos mientan"},
      {verbo:"caer",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"1ª singular",respuesta:"yo caía"},
      {verbo:"traer",modo:"indicativo",tiempo:"futuro simple",persona:"2ª singular",respuesta:"tú traerás"},
      {verbo:"dar",modo:"subjuntivo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros demos"},
      {verbo:"morir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"3ª plural",respuesta:"ellos han muerto"},
      {verbo:"traducir",modo:"indicativo",tiempo:"presente",persona:"1ª singular",respuesta:"yo traduzco"},
      {verbo:"crecer",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros crezcáis"},
      {verbo:"huir",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"3ª plural",respuesta:"ellos huyeron"},
      {verbo:"construir",modo:"indicativo",tiempo:"presente",persona:"3ª singular",respuesta:"él construye"},
      {verbo:"conducir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"1ª singular",respuesta:"yo he conducido"},
      {verbo:"medir",modo:"subjuntivo",tiempo:"presente",persona:"2ª singular",respuesta:"tú midas"},
      {verbo:"sentir",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"3ª plural",respuesta:"ellos sentían"},
      {verbo:"repetir",modo:"indicativo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros repetimos"},
      {verbo:"enviar",modo:"indicativo",tiempo:"futuro simple",persona:"2ª plural",respuesta:"vosotros enviaréis"},
      {verbo:"divertir",modo:"subjuntivo",tiempo:"presente",persona:"3ª singular",respuesta:"él divierta"},
      {verbo:"advertir",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"1ª plural",respuesta:"nosotros advertimos"},
      {verbo:"preferir",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros prefiráis"},
      {verbo:"servir",modo:"indicativo",tiempo:"presente",persona:"1ª singular",respuesta:"yo sirvo"},
      {verbo:"vestir",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"3ª plural",respuesta:"ellos vestían"},
      {verbo:"reír",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos rían"},
      {verbo:"sonreír",modo:"indicativo",tiempo:"futuro simple",persona:"1ª singular",respuesta:"yo sonreiré"},
      {verbo:"pedir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú pide"},
      {verbo:"seguir",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos sigan"},
      {verbo:"conseguir",modo:"indicativo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros conseguís"},
      {verbo:"convertir",modo:"subjuntivo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros convirtamos"},
      {verbo:"elegir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"2ª singular",respuesta:"tú has elegido"},
      {verbo:"corregir",modo:"indicativo",tiempo:"presente",persona:"3ª singular",respuesta:"él corrige"},
      {verbo:"seguir",modo:"indicativo",tiempo:"futuro simple",persona:"3ª plural",respuesta:"ellos seguirán"},
      {verbo:"repetir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros repetid"},
      {verbo:"medir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"1ª singular",respuesta:"yo he medido"},
      {verbo:"construir",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros construyáis"},
      {verbo:"reír",modo:"indicativo",tiempo:"presente",persona:"2ª singular",respuesta:"tú ríes"},
      {verbo:"divertir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros divertid"},
      {verbo:"mentir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"3ª plural",respuesta:"ellos han mentido"},
      {verbo:"sentir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú siente"},
      {verbo:"advertir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros advertid"},
      {verbo:"preferir",modo:"indicativo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros preferimos"},
      {verbo:"vestir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros vestid"},
      {verbo:"conseguir",modo:"subjuntivo",tiempo:"presente",persona:"2ª singular",respuesta:"tú consigas"},
      {verbo:"pedir",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos pidan"},
      {verbo:"cantar",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"3ª plural",respuesta:"ellos cantaron"},
      {verbo:"comer",modo:"indicativo",tiempo:"presente",persona:"1ª singular",respuesta:"yo como"},
      {verbo:"vivir",modo:"indicativo",tiempo:"futuro simple",persona:"2ª plural",respuesta:"vosotros viviréis"},
      {verbo:"amar",modo:"subjuntivo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros amemos"},
      {verbo:"correr",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú corre"},
      {verbo:"leer",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"3ª singular",respuesta:"él leía"},
      {verbo:"escribir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"1ª plural",respuesta:"nosotros hemos escrito"},
      {verbo:"beber",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros bebáis"},
      {verbo:"salir",modo:"indicativo",tiempo:"futuro simple",persona:"1ª singular",respuesta:"yo saldré"},
      {verbo:"abrir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros abrid"},
      {verbo:"ver",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos vean"},
      {verbo:"tener",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"2ª singular",respuesta:"tú tuviste"},
      {verbo:"hacer",modo:"indicativo",tiempo:"presente",persona:"3ª singular",respuesta:"él hace"},
      {verbo:"decir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú di"},
      {verbo:"pensar",modo:"indicativo",tiempo:"futuro simple",persona:"1ª plural",respuesta:"nosotros pensaremos"},
      {verbo:"trabajar",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"1ª plural",respuesta:"nosotros trabajábamos"},
      {verbo:"viajar",modo:"indicativo",tiempo:"futuro simple",persona:"2ª plural",respuesta:"vosotros viajaréis"},
      {verbo:"conocer",modo:"subjuntivo",tiempo:"presente",persona:"1ª singular",respuesta:"yo conozca"},
      {verbo:"jugar",modo:"indicativo",tiempo:"presente",persona:"2ª singular",respuesta:"tú juegas"},
      {verbo:"dormir",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos duerman"},
      {verbo:"estudiar",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"1ª singular",respuesta:"yo he estudiado"},
      {verbo:"creer",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"3ª plural",respuesta:"ellos creían"},
      {verbo:"bailar",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú baila"},
      {verbo:"nadar",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros nadéis"},
      {verbo:"ayudar",modo:"indicativo",tiempo:"presente",persona:"3ª singular",respuesta:"él ayuda"},
      {verbo:"leer",modo:"subjuntivo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros leamos"},
      {verbo:"vivir",modo:"subjuntivo",tiempo:"presente",persona:"1ª singular",respuesta:"yo viva"},
      {verbo:"abrir",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros abráis"},
      {verbo:"decidir",modo:"indicativo",tiempo:"futuro simple",persona:"3ª singular",respuesta:"él decidirá"},
      {verbo:"pensar",modo:"subjuntivo",tiempo:"presente",persona:"2ª singular",respuesta:"tú pienses"},
      {verbo:"seguir",modo:"indicativo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros seguimos"},
      {verbo:"esquiar",modo:"indicativo",tiempo:"futuro simple",persona:"3ª plural",respuesta:"ellos esquiarán"},
      {verbo:"viajar",modo:"subjuntivo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros viajemos"},
      {verbo:"saltar",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros saltad"},
      {verbo:"caminar",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"1ª plural",respuesta:"nosotros caminábamos"},
      {verbo:"gritar",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú grita"},
      {verbo:"cocinar",modo:"indicativo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros cocináis"},
      {verbo:"descansar",modo:"subjuntivo",tiempo:"presente",persona:"3ª singular",respuesta:"él descanse"},
      {verbo:"beber",modo:"indicativo",tiempo:"futuro simple",persona:"2ª singular",respuesta:"tú beberás"},
      {verbo:"reír",modo:"subjuntivo",tiempo:"presente",persona:"1ª plural",respuesta:"nosotros riamos"},
      {verbo:"jugar",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros juguéis"},
      {verbo:"leer",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"3ª plural",respuesta:"ellos han leído"},
      {verbo:"viajar",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros viajad"},
      {verbo:"escribir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú escribe"},
      {verbo:"soñar",modo:"indicativo",tiempo:"presente",persona:"1ª singular",respuesta:"yo sueño"},
      {verbo:"subir",modo:"indicativo",tiempo:"futuro simple",persona:"3ª plural",respuesta:"ellos subirán"},
      {verbo:"ver",modo:"indicativo",tiempo:"pretérito imperfecto",persona:"2ª singular",respuesta:"tú veías"},
      {verbo:"tener",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos tengan"},
      {verbo:"decir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"1ª singular",respuesta:"yo he dicho"},
      {verbo:"abrir",modo:"indicativo",tiempo:"presente",persona:"2ª singular",respuesta:"tú abres"},
      {verbo:"cantar",modo:"subjuntivo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos canten"},
      {verbo:"caminar",modo:"subjuntivo",tiempo:"presente",persona:"2ª plural",respuesta:"vosotros caminéis"},
      {verbo:"saltar",modo:"indicativo",tiempo:"presente",persona:"1ª singular",respuesta:"yo salto"},
      {verbo:"leer",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros leed"},
      {verbo:"pensar",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros pensad"},
      {verbo:"ver",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú ve"},
      {verbo:"hacer",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros haced"},
      {verbo:"ir",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"1ª plural",respuesta:"nosotros fuimos"},
      {verbo:"ir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"tú ve"},
      {verbo:"tener",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"vosotros tened"},
      {verbo:"ser",modo:"indicativo",tiempo:"presente",persona:"1ª singular",respuesta:"yo soy"},
      {verbo:"estar",modo:"subjuntivo",tiempo:"presente",persona:"2ª singular",respuesta:"tú estés"},
      {verbo:"poder",modo:"indicativo",tiempo:"presente",persona:"3ª plural",respuesta:"ellos pueden"},
      {verbo:"dormir",modo:"indicativo",tiempo:"pretérito perfecto compuesto",persona:"1ª plural",respuesta:"nosotros hemos dormido"},
      {verbo:"leer",modo:"indicativo",tiempo:"futuro simple",persona:"3ª plural",respuesta:"ellos leerán"},
      {verbo:"tener",modo:"indicativo",tiempo:"condicional simple",persona:"1ª singular",respuesta:"yo tendría"},
      {verbo:"hacer",modo:"indicativo",tiempo:"condicional simple",persona:"1ª plural",respuesta:"nosotros haríamos"},
      {verbo:"decir",modo:"indicativo",tiempo:"futuro simple",persona:"2ª plural",respuesta:"vosotros diréis"},
      {verbo:"poder",modo:"indicativo",tiempo:"pretérito pluscuamperfecto",persona:"3ª plural",respuesta:"ellos habían podido"},
      {verbo:"ver",modo:"indicativo",tiempo:"futuro perfecto",persona:"1ª singular",respuesta:"yo habré visto"},
      {verbo:"escribir",modo:"indicativo",tiempo:"condicional compuesto",persona:"3ª singular",respuesta:"él habría escrito"},
      {verbo:"venir",modo:"indicativo",tiempo:"pretérito pluscuamperfecto",persona:"1ª plural",respuesta:"nosotros habíamos venido"},
      {verbo:"poner",modo:"indicativo",tiempo:"futuro perfecto",persona:"3ª plural",respuesta:"ellos habrán puesto"},
      {verbo:"querer",modo:"indicativo",tiempo:"condicional simple",persona:"2ª singular",respuesta:"tú querrías"},
      {verbo:"saber",modo:"indicativo",tiempo:"futuro simple",persona:"1ª singular",respuesta:"yo sabré"},
      {verbo:"caber",modo:"indicativo",tiempo:"futuro simple",persona:"3ª singular",respuesta:"él cabrá"},
      {verbo:"haber",modo:"indicativo",tiempo:"condicional simple",persona:"1ª singular",respuesta:"yo habría"},
      {verbo:"hacer",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"1ª singular",respuesta:"yo hice"},
      {verbo:"andar",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"3ª plural",respuesta:"ellos anduvieron"},
      {verbo:"traer",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"1ª singular",respuesta:"yo traje"},
      {verbo:"conducir",modo:"indicativo",tiempo:"pretérito perfecto simple",persona:"1ª plural",respuesta:"nosotros condujimos"},
      {verbo:"tener",modo:"subjuntivo",tiempo:"pretérito imperfecto",persona:"1ª singular",respuesta:"yo tuviera"},
      {verbo:"ser",modo:"subjuntivo",tiempo:"pretérito imperfecto",persona:"1ª plural",respuesta:"nosotros fuéramos"},
      {verbo:"ir",modo:"subjuntivo",tiempo:"pretérito imperfecto",persona:"3ª plural",respuesta:"ellos fueran"},
      {verbo:"haber",modo:"subjuntivo",tiempo:"presente",persona:"3ª singular",respuesta:"él haya"},
      {verbo:"hacer",modo:"subjuntivo",tiempo:"pretérito perfecto",persona:"2ª singular",respuesta:"tú hayas hecho"},
      {verbo:"ver",modo:"subjuntivo",tiempo:"pretérito pluscuamperfecto",persona:"3ª plural",respuesta:"ellos hubieran visto"},
      {verbo:"decir",modo:"subjuntivo",tiempo:"pretérito imperfecto",persona:"2ª plural",respuesta:"vosotros dijerais"},
      {verbo:"poder",modo:"subjuntivo",tiempo:"pretérito perfecto",persona:"1ª plural",respuesta:"nosotros hayamos podido"},
      {verbo:"venir",modo:"subjuntivo",tiempo:"pretérito imperfecto",persona:"3ª singular",respuesta:"él viniera"},
      {verbo:"poner",modo:"subjuntivo",tiempo:"pretérito perfecto",persona:"1ª singular",respuesta:"yo haya puesto"},
      {verbo:"salir",modo:"subjuntivo",tiempo:"pretérito imperfecto",persona:"2ª plural",respuesta:"vosotros salierais"},
      {verbo:"querer",modo:"subjuntivo",tiempo:"pretérito perfecto",persona:"3ª plural",respuesta:"ellos hayan querido"},
      {verbo:"ir",modo:"imperativo",tiempo:"negativo",persona:"2ª singular",respuesta:"no vayas"},
      {verbo:"decir",modo:"imperativo",tiempo:"negativo",persona:"2ª plural",respuesta:"no digáis"},
      {verbo:"hacer",modo:"imperativo",tiempo:"negativo",persona:"2ª singular",respuesta:"no hagas"},
      {verbo:"poner",modo:"imperativo",tiempo:"negativo",persona:"2ª singular",respuesta:"no pongas"},
      {verbo:"tener",modo:"imperativo",tiempo:"negativo",persona:"2ª plural",respuesta:"no tengáis"},
      {verbo:"venir",modo:"imperativo",tiempo:"negativo",persona:"2ª singular",respuesta:"no vengas"},
      {verbo:"salir",modo:"imperativo",tiempo:"negativo",persona:"2ª plural",respuesta:"no salgáis"},
      {verbo:"ser",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"sé"},
      {verbo:"ir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª plural",respuesta:"id"},
      {verbo:"poner",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"pon"},
      {verbo:"venir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"ven"},
      {verbo:"salir",modo:"imperativo",tiempo:"afirmativo",persona:"2ª singular",respuesta:"sal"},
      {verbo:"freír",modo:"forma no personal",tiempo:"participio",persona:"—",respuesta:"frito"},
      {verbo:"imprimir",modo:"forma no personal",tiempo:"participio",persona:"—",respuesta:"impreso"},
      {verbo:"prever",modo:"forma no personal",tiempo:"participio",persona:"—",respuesta:"previsto"},
      {verbo:"dormir",modo:"forma no personal",tiempo:"gerundio",persona:"—",respuesta:"durmiendo"},
      {verbo:"leer",modo:"forma no personal",tiempo:"gerundio",persona:"—",respuesta:"leyendo"},
      {verbo:"decir",modo:"forma no personal",tiempo:"gerundio",persona:"—",respuesta:"diciendo"},
      {verbo:"poder",modo:"forma no personal",tiempo:"gerundio",persona:"—",respuesta:"pudiendo"},
      {verbo:"ir",modo:"forma no personal",tiempo:"gerundio",persona:"—",respuesta:"yendo"}

  ].map((q,index)=>Object.assign({id:'q'+(index+1)},q));

  const REGULAR_VERBS={
    ar:['cantar','amar','bailar','trabajar','estudiar','viajar','caminar','saltar','gritar','cocinar','descansar','ayudar','mirar','hablar','comprar','escuchar','preguntar','entrar','llamar','tomar','necesitar','preparar','limpiar','visitar','esperar','dibujar','celebrar','cuidar'],
    er:['comer','beber','correr','aprender','comprender','responder','vender','deber','temer','prometer','barrer','sorprender'],
    ir:['vivir','subir','decidir','permitir','recibir','compartir','existir','asistir','partir','unir','sufrir','cumplir','discutir']
  };
  const PERSONS=[
    {key:'1s',label:'1ª singular',pronoun:'yo',index:0},
    {key:'2s',label:'2ª singular',pronoun:'tú',index:1},
    {key:'3s',label:'3ª singular',pronoun:'él',index:2},
    {key:'1p',label:'1ª plural',pronoun:'nosotros',index:3},
    {key:'2p',label:'2ª plural',pronoun:'vosotros',index:4},
    {key:'3p',label:'3ª plural',pronoun:'ellos',index:5}
  ];
  const AUX={
    present:['he','has','ha','hemos','habéis','han'],
    imperfect:['había','habías','había','habíamos','habíais','habían'],
    future:['habré','habrás','habrá','habremos','habréis','habrán'],
    conditional:['habría','habrías','habría','habríamos','habríais','habrían'],
    subjPresent:['haya','hayas','haya','hayamos','hayáis','hayan'],
    subjImperfect:['hubiera','hubieras','hubiera','hubiéramos','hubierais','hubieran']
  };
  function regularParts(verb){
    const ending=verb.slice(-2),stem=verb.slice(0,-2);
    return {ending,stem,participle:stem+(ending==='ar'?'ado':'ido'),gerund:stem+(ending==='ar'?'ando':'iendo')};
  }
  function regularSimple(verb,tense,index){
    const {ending,stem}=regularParts(verb);
    const table={
      present:{
        ar:['o','as','a','amos','áis','an'],
        er:['o','es','e','emos','éis','en'],
        ir:['o','es','e','imos','ís','en']
      },
      imperfect:{
        ar:['aba','abas','aba','ábamos','abais','aban'],
        er:['ía','ías','ía','íamos','íais','ían'],
        ir:['ía','ías','ía','íamos','íais','ían']
      },
      future:['é','ás','á','emos','éis','án'],
      conditional:['ía','ías','ía','íamos','íais','ían'],
      subjPresent:{
        ar:['e','es','e','emos','éis','en'],
        er:['a','as','a','amos','áis','an'],
        ir:['a','as','a','amos','áis','an']
      },
      subjImperfect:{
        ar:['ara','aras','ara','áramos','arais','aran'],
        er:['iera','ieras','iera','iéramos','ierais','ieran'],
        ir:['iera','ieras','iera','iéramos','ierais','ieran']
      }
    };
    if(tense==='future'||tense==='conditional')return verb+table[tense][index];
    return stem+table[tense][ending][index];
  }
  function pushRegularQuestion(target,verb,mode,time,person,response,tier){
    target.push({verbo:verb,modo:mode,tiempo:time,persona:person,respuesta:response,tier:tier});
  }
  function buildRegularExpansion(){
    const out=[];
    Object.values(REGULAR_VERBS).flat().forEach(verb=>{
      const parts=regularParts(verb);
      PERSONS.forEach(p=>{
        pushRegularQuestion(out,verb,'indicativo','presente',p.label,p.pronoun+' '+regularSimple(verb,'present',p.index),'basic');
        pushRegularQuestion(out,verb,'indicativo','pretérito imperfecto',p.label,p.pronoun+' '+regularSimple(verb,'imperfect',p.index),'basic');
        pushRegularQuestion(out,verb,'indicativo','futuro simple',p.label,p.pronoun+' '+regularSimple(verb,'future',p.index),'basic');

        pushRegularQuestion(out,verb,'indicativo','pretérito perfecto compuesto',p.label,p.pronoun+' '+AUX.present[p.index]+' '+parts.participle,'medium');
        pushRegularQuestion(out,verb,'indicativo','pretérito pluscuamperfecto',p.label,p.pronoun+' '+AUX.imperfect[p.index]+' '+parts.participle,'medium');
        pushRegularQuestion(out,verb,'indicativo','condicional simple',p.label,p.pronoun+' '+regularSimple(verb,'conditional',p.index),'medium');

        pushRegularQuestion(out,verb,'subjuntivo','presente',p.label,p.pronoun+' '+regularSimple(verb,'subjPresent',p.index),'advanced');
        pushRegularQuestion(out,verb,'indicativo','futuro perfecto',p.label,p.pronoun+' '+AUX.future[p.index]+' '+parts.participle,'expert');
        pushRegularQuestion(out,verb,'indicativo','condicional compuesto',p.label,p.pronoun+' '+AUX.conditional[p.index]+' '+parts.participle,'expert');

        pushRegularQuestion(out,verb,'subjuntivo','pretérito imperfecto',p.label,p.pronoun+' '+regularSimple(verb,'subjImperfect',p.index),'expert');
        pushRegularQuestion(out,verb,'subjuntivo','pretérito perfecto',p.label,p.pronoun+' '+AUX.subjPresent[p.index]+' '+parts.participle,'expert');
        pushRegularQuestion(out,verb,'subjuntivo','pretérito pluscuamperfecto',p.label,p.pronoun+' '+AUX.subjImperfect[p.index]+' '+parts.participle,'expert');
      });
      const {stem,ending}=parts;
      const affTu=stem+(ending==='ar'?'a':'e');
      const affVos=stem+(ending==='ar'?'ad':ending==='er'?'ed':'id');
      pushRegularQuestion(out,verb,'imperativo','afirmativo','2ª singular','tú '+affTu,'advanced');
      pushRegularQuestion(out,verb,'imperativo','afirmativo','2ª plural','vosotros '+affVos,'advanced');
      pushRegularQuestion(out,verb,'imperativo','negativo','2ª singular','no '+regularSimple(verb,'subjPresent',1),'advanced');
      pushRegularQuestion(out,verb,'imperativo','negativo','2ª plural','no '+regularSimple(verb,'subjPresent',4),'advanced');
      pushRegularQuestion(out,verb,'forma no personal','gerundio','—',parts.gerund,'expert');
      pushRegularQuestion(out,verb,'forma no personal','participio','—',parts.participle,'expert');
    });
    return out;
  }
  buildRegularExpansion().forEach((q,index)=>{
    q.id='r'+(index+1);
    QUESTION_BANK.push(q);
  });


  const ACHIEVEMENTS=[
    {id:'first_correct',icon:'✅',title:'Primera ficha',desc:'Acierta tu primer reto.',xp:20},
    {id:'first_win',icon:'🏆',title:'Primer duelo',desc:'Gana una partida.',xp:35},
    {id:'streak3',icon:'🔥',title:'En racha',desc:'Encadena 3 aciertos.',xp:25},
    {id:'streak5',icon:'🔥',title:'Imparable',desc:'Encadena 5 aciertos.',xp:45},
    {id:'streak8',icon:'🌋',title:'Modo leyenda',desc:'Encadena 8 aciertos.',xp:80},
    {id:'big_bet',icon:'💰',title:'Sin miedo',desc:'Gana una apuesta de 50 fichas o más.',xp:30},
    {id:'all_in',icon:'🎲',title:'Todo o nada',desc:'Gana apostando todas tus fichas.',xp:60},
    {id:'bank500',icon:'💎',title:'Caja fuerte',desc:'Alcanza 500 fichas en una partida.',xp:40},
    {id:'bank1000',icon:'👑',title:'Magnate verbal',desc:'Alcanza 1000 fichas en una partida.',xp:90},
    {id:'perfect5',icon:'🎯',title:'Precisión total',desc:'Termina una partida de 5+ rondas sin fallar.',xp:70},
    {id:'no_rescue',icon:'🛟',title:'Sin salvavidas',desc:'Gana sin necesitar rescate.',xp:35},
    {id:'rescue_win',icon:'🌊',title:'De vuelta a flote',desc:'Gana después de usar un rescate.',xp:50},
    {id:'subj5',icon:'🌙',title:'Subjuntivo dominado',desc:'Acierta 5 retos de subjuntivo.',xp:45},
    {id:'imperative5',icon:'📣',title:'A tus órdenes',desc:'Acierta 5 imperativos.',xp:45},
    {id:'irregular10',icon:'⚡',title:'Cazairregulares',desc:'Acierta 10 verbos irregulares.',xp:60},
    {id:'expert3',icon:'🧠',title:'Zona experta',desc:'Acierta 3 retos expertos.',xp:55},
    {id:'accent10',icon:'´',title:'Tildes de acero',desc:'10 respuestas correctas seguidas sin error de tilde.',xp:45},
    {id:'games5',icon:'🎮',title:'Habitual de la mesa',desc:'Completa 5 partidas.',xp:40},
    {id:'games20',icon:'🕹️',title:'Veterano',desc:'Completa 20 partidas.',xp:100},
    {id:'wins5',icon:'🥇',title:'Quíntuple campeón',desc:'Gana 5 partidas.',xp:75},
    {id:'correct50',icon:'📚',title:'Conjugador',desc:'Alcanza 50 aciertos acumulados.',xp:60},
    {id:'correct150',icon:'📖',title:'Maestro verbal',desc:'Alcanza 150 aciertos acumulados.',xp:120},
    {id:'level5',icon:'⭐',title:'Nivel 5',desc:'Alcanza el nivel 5.',xp:50},
    {id:'level10',icon:'🌟',title:'Nivel 10',desc:'Alcanza el nivel 10.',xp:100}
  ];
  const ACH_MAP=Object.fromEntries(ACHIEVEMENTS.map(a=>[a.id,a]));

  function defaultSave(){
    return {version:2,xp:0,achievements:[],lifetime:{games:0,wins:0,losses:0,draws:0,attempts:0,correct:0,errors:0,accentErrors:0,rescues:0,maxStreak:0,subjCorrect:0,imperativeCorrect:0,irregularCorrect:0,expertCorrect:0},best:{chips:100,streak:0},updatedAt:''};
  }
  function normalizeSave(raw){
    const base=defaultSave(),src=raw&&typeof raw==='object'?raw:{};
    base.xp=Math.max(0,Number(src.xp||0));
    base.achievements=Array.isArray(src.achievements)?src.achievements.map(String):[];
    Object.assign(base.lifetime,src.lifetime||{});
    Object.assign(base.best,src.best||{});
    return base;
  }
  function levelFromXp(xp){return 1+Math.floor(Math.max(0,Number(xp||0))/250)}
  function xpIntoLevel(xp){return Math.max(0,Number(xp||0))%250}
  function difficultyOf(q){
    if(q.tier&&TIERS[q.tier])return q.tier;
    let score=1;
    const mode=String(q.modo).toLowerCase(),time=String(q.tiempo).toLowerCase();
    if(IRREGULAR.has(q.verbo))score++;
    if(time.includes('perfecto compuesto')||time.includes('pluscuamperfecto')||time.includes('perfecto simple'))score++;
    if(time.includes('condicional')||time.includes('futuro perfecto'))score++;
    if(mode==='subjuntivo')score+=2;
    if(mode==='imperativo')score+=2;
    if(mode==='forma no personal')score+=3;
    if(time.includes('imperfecto')&&mode==='subjuntivo')score++;
    if(time.includes('pluscuamperfecto')&&mode==='subjuntivo')score++;
    if(score<=2)return 'basic';
    if(score===3)return 'medium';
    if(score<=5)return 'advanced';
    return 'expert';
  }
  QUESTION_BANK.forEach(q=>q.tier=difficultyOf(q));

  function allowedPronouns(person){
    if(person==='1ª singular')return ['yo'];
    if(person==='2ª singular')return ['tú','tu'];
    if(person==='3ª singular')return ['él','el','ella','usted'];
    if(person==='1ª plural')return ['nosotros','nosotras'];
    if(person==='2ª plural')return ['vosotros','vosotras'];
    if(person==='3ª plural')return ['ellos','ellas','ustedes'];
    return [];
  }
  function norm(s){return String(s||'').normalize('NFC').toLowerCase().trim().replace(/[.,;:¡!¿?]+/g,'').replace(/\s+/g,' ')}
  function accentless(s){return norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
  const ALTERNATIVES={
    'freír|forma no personal|participio':['freído'],
    'imprimir|forma no personal|participio':['imprimido'],
    'tener|subjuntivo|pretérito imperfecto':['yo tuviese'],
    'ser|subjuntivo|pretérito imperfecto':['nosotros fuésemos'],
    'ir|subjuntivo|pretérito imperfecto':['ellos fuesen'],
    'ver|subjuntivo|pretérito pluscuamperfecto':['ellos hubiesen visto'],
    'decir|subjuntivo|pretérito imperfecto':['vosotros dijeseis'],
    'venir|subjuntivo|pretérito imperfecto':['él viniese'],
    'salir|subjuntivo|pretérito imperfecto':['vosotros salieseis']
  };
  function expectedForms(q){
    const base=norm(q.respuesta);
    const forms=new Set([base]);
    (ALTERNATIVES[q.verbo+'|'+q.modo+'|'+q.tiempo]||[]).forEach(v=>forms.add(norm(v)));
    const pronouns=allowedPronouns(q.persona);
    let stem=base;
    for(const p of ['nosotros','nosotras','vosotros','vosotras','ustedes','ellos','ellas','usted','ella','él','el','tú','tu','yo']){
      if(stem.startsWith(p+' ')){stem=stem.slice(p.length+1);break}
    }
    forms.add(stem);
    pronouns.forEach(p=>forms.add(norm(p+' '+stem)));
    if(q.modo==='imperativo'&&stem.startsWith('no ')){
      const bare=stem.slice(3);
      forms.add('no '+bare);
      pronouns.forEach(p=>forms.add(norm('no '+p+' '+bare)));
    }
    return Array.from(forms);
  }
  function checkAnswer(q,user){
    const u=norm(user),forms=expectedForms(q);
    if(forms.includes(u))return {ok:true,kind:'correct'};
    if(forms.some(f=>accentless(f)===accentless(u)))return {ok:false,kind:'accent'};
    return {ok:false,kind:'form'};
  }
  function hintFor(q){
    const t=q.tiempo.toLowerCase();
    if(t.includes('compuesto')||t.includes('perfecto'))return 'Piensa primero en el auxiliar «haber» y después en el participio.';
    if(q.modo==='subjuntivo')return 'Busca la raíz verbal y recuerda las terminaciones propias del subjuntivo.';
    if(q.modo==='imperativo'&&t==='negativo')return 'El imperativo negativo se construye con «no» y una forma de subjuntivo.';
    if(q.modo==='imperativo')return 'Fíjate en la persona: tú y vosotros tienen formas muy reconocibles.';
    if(q.modo==='forma no personal')return 'No necesitas persona gramatical: piensa en infinitivo, gerundio o participio.';
    return 'Di la persona en voz alta y completa la forma verbal antes de escribirla.';
  }

  function makePlayer(name,index,save,role){
    return {index,name:name||('Jugador '+(index+1)),role:role||'guest',chips:100,correct:0,errors:0,accentErrors:0,streak:0,maxStreak:0,rescues:0,insurance:1,swap:1,xpGain:0,allInWins:0,bigBetWins:0,subjCorrect:0,imperativeCorrect:0,irregularCorrect:0,expertCorrect:0,save:normalizeSave(save),newAchievements:[]};
  }


export const bankSize=QUESTION_BANK.length;
export function rules(state){
const toast=()=>{};
  function bankForTier(tier){
    return QUESTION_BANK.filter(q=>q.tier===tier && (state.bankMode==='complete'||!(q.modo==='forma no personal'||(q.modo==='subjuntivo'&&(q.tiempo.includes('imperfecto')||q.tiempo.includes('perfecto'))))));
  }
  function answerKey(q){return norm(q&&q.respuesta||'')}
  function pickQuestion(tier){
    const bank=bankForTier(tier);
    let pool=bank.filter(q=>!state.used.has(q.id)&&!state.usedAnswers.has(answerKey(q))&&!state.recentVerbs.includes(q.verbo));
    if(!pool.length)pool=bank.filter(q=>!state.used.has(q.id)&&!state.usedAnswers.has(answerKey(q)));
    if(!pool.length)pool=bank.filter(q=>!state.used.has(q.id));
    if(!pool.length){
      bank.forEach(q=>state.used.delete(q.id));
      pool=bank.filter(q=>!state.usedAnswers.has(answerKey(q))&&!state.recentVerbs.includes(q.verbo));
    }
    if(!pool.length)pool=bank;
    const q=pool[Math.floor(Math.random()*pool.length)];
    if(q){
      state.used.add(q.id);
      state.usedAnswers.add(answerKey(q));
      state.recentVerbs.push(q.verbo);
      if(state.recentVerbs.length>6)state.recentVerbs.shift();
    }
    return q;
  }

  function addXp(p,amount){
    amount=Math.max(0,Math.round(amount));p.xpGain+=amount;p.save.xp+=amount;
  }
  function unlock(p,id){
    if(p.save.achievements.includes(id))return false;
    const a=ACH_MAP[id];if(!a)return false;
    p.save.achievements.push(id);p.newAchievements.push(a);state.newUnlocks.push({player:p.name,achievement:a});
    addXp(p,a.xp);toast('🏆 '+a.title,p.name+' · +'+a.xp+' XP',true);return true;
  }
  function evaluateLiveAchievements(p,bet,wasAllIn){
    if(p.correct>=1)unlock(p,'first_correct');
    if(p.streak>=3)unlock(p,'streak3');
    if(p.streak>=5)unlock(p,'streak5');
    if(p.streak>=8)unlock(p,'streak8');
    if(p.bigBetWins>=1)unlock(p,'big_bet');
    if(wasAllIn&&p.allInWins>=1)unlock(p,'all_in');
    if(p.chips>=500)unlock(p,'bank500');
    if(p.chips>=1000)unlock(p,'bank1000');
    if(p.subjCorrect>=5)unlock(p,'subj5');
    if(p.imperativeCorrect>=5)unlock(p,'imperative5');
    if(p.irregularCorrect>=10)unlock(p,'irregular10');
    if(p.expertCorrect>=3)unlock(p,'expert3');
    const life=p.save.lifetime;
    if(life.correct>=50)unlock(p,'correct50');
    if(life.correct>=150)unlock(p,'correct150');
    if(levelFromXp(p.save.xp)>=5)unlock(p,'level5');
    if(levelFromXp(p.save.xp)>=10)unlock(p,'level10');
  }

return {pickQuestion,addXp,unlock,evaluateLiveAchievements};
}
export {TIERS,IRREGULAR,checkAnswer,hintFor,normalizeSave,makePlayer,levelFromXp};
