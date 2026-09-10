import test from 'node:test';
import assert from 'node:assert/strict';
import {leadSchema} from '../lib/validation';
import {questions,maskPhone} from '../lib/questions';
const valid={answers:questions.map(q=>q.options[0]),name:'Pessoa Teste',phone:'(11) 99999-1234',consent:true,marketing_consent:false,attribution:{source_url:'https://example.com/?utm_source=test'}};
test('normaliza telefone e preserva escolhas e atribuição',()=>{const lead=leadSchema.parse(valid);assert.equal(lead.phone,'5511999991234');assert.equal(lead.attribution.source_url,valid.attribution.source_url);assert.equal(lead.marketing_consent,false)});
test('rejeita respostas forjadas, consentimento ausente e honeypot',()=>{for(const change of [{answers:['fake',...valid.answers.slice(1)]},{consent:false},{website:'spam'},{name:'Luis'},{phone:'00000000000'},{attribution:{source_url:'javascript:alert(1)'}}])assert.equal(leadSchema.safeParse({...valid,...change}).success,false)});
test('máscara completa, parcial e entrada colada',()=>{assert.equal(maskPhone('11999991234'),'(11) 99999-1234');assert.equal(maskPhone('(11) 99999-1234'),'(11) 99999-1234');assert.equal(maskPhone('119'),'('+'11) 9');assert.equal(maskPhone(''),'')});
