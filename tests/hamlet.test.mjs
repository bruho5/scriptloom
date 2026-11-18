import test from 'node:test';
import assert from 'node:assert/strict';
import {hamletDemo,parseImport,serialize} from '../src/core.js';
test('Hamlet is independently created, attributed and round-trips',()=>{
const sample=hamletDemo('en');assert.equal(sample.language,'en');assert.match(sample.scratchpad,/shakespeare.mit.edu/);assert.match(sample.script.text,/Who's there/);assert.deepEqual(parseImport(serialize(sample)),sample);assert.notEqual(hamletDemo().groups[0].id,sample.groups[0].id);
for(const mark of sample.script.marks)assert.ok(mark.start>=0&&mark.end<=sample.script.text.length&&mark.end>mark.start);
});
