/* Keep repeated decision lists out of the player card without editing the story. */
(function (root) {
  'use strict';
  function tokens(value) {
    return Array.from(String(value).matchAll(/[\p{L}\p{M}\p{N}]+/gu), function (match) {
      return {value:match[0].normalize('NFC').toLocaleLowerCase('es'), start:match.index};
    });
  }
  function sceneText(value, choices) {
    var original=String(value == null ? '' : value);
    var options=(Array.isArray(choices) ? choices : []).map(function (choice) {
      return tokens(choice.text || '');
    });
    // A lone continuation or a partial match is not a repeated decision list.
    if(options.length<2 || options.some(function (option) { return !option.length; }))return original;
    var words=tokens(original);
    function consume(end, remaining) {
      if(!remaining.length)return end;
      for(var i=0;i<remaining.length;i++) {
        var option=remaining[i], start=end-option.length;
        if(start<0 || !option.every(function (token,j) { return words[start+j].value===token.value; }))continue;
        var rest=remaining.slice(0,i).concat(remaining.slice(i+1));
        var result=consume(start,rest);
        if(result!==null)return result;
        // Accept the conjunction between inline options ("A o B").
        if(rest.length && start>0 && /^(?:o|u|y|e)$/.test(words[start-1].value)) {
          result=consume(start-1,rest);
          if(result!==null)return result;
        }
      }
      return null;
    }
    var first=consume(words.length,options);
    if(first===null || !words[first])return original;
    var narrative=original.slice(0,words[first].start).trimEnd();
    // A short standalone question belongs with the choices, not the scene.
    narrative=narrative.replace(/(?:^|\n|(?<=[.!?])\s+)¿\s*qué (?:haces|eliges|decides)\s*\?\s*$/iu,'').trimEnd();
    return narrative;
  }
  if(typeof module==='object' && module.exports)module.exports=sceneText;
  else root.RayuelaSceneText=sceneText;
})(typeof window==='object' ? window : globalThis);
