// Run after npm run build. Uses the production-compiled Nest/Mongoose modules.
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { Test } = require('@nestjs/testing');
const { MongooseModule } = require('@nestjs/mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const { AuthService } = require('../dist/auth/auth.service.js');
const { Site, SiteSchema } = require('../dist/sites/site.schema.js');
const { SitesController } = require('../dist/sites/sites.controller.js');
const { SitesService } = require('../dist/sites/sites.service.js');
const { parseSiteInput } = require('../dist/sites/site-input.js');
const input = () => ({ name: 'Test venue', latitude: 51.5, longitude: -.1, locationLabel: 'Test coordinates', features: [], plan: { purpose: 'Assessment', risks: '', actions: '', assumptions: '' } });
describe('Account-owned location persistence', () => {
  let app, mongo, saved;
  before(async () => {
    mongo = await MongoMemoryServer.create();
    const module = await Test.createTestingModule({ imports: [MongooseModule.forRoot(mongo.getUri()), MongooseModule.forFeature([{ name: Site.name, schema: SiteSchema }])], controllers: [SitesController], providers: [SitesService, { provide: AuthService, useValue: { getSessionProfile: header => header === 'Bearer alice' ? { email: 'alice@example.test' } : header === 'Bearer bob' ? { email: 'bob@example.test' } : null } }] }).compile();
    app = module.createNestApplication(); await app.init();
  }, { timeout: 60000 });
  after(async () => { await app?.close(); await mongo?.stop(); });
  it('requires an authenticated session', async () => { await request(app.getHttpServer()).get('/sites').expect(401); await request(app.getHttpServer()).post('/sites').send(input()).expect(401); });
  it('creates and reopens a saved location without leaking ownership data', async () => {
    const result = await request(app.getHttpServer()).post('/sites').set('Authorization', 'Bearer alice').send({ ...input(), ownerEmail: 'bob@example.test' }).expect(201); saved = result.body;
    assert.match(saved.id, /^[a-f0-9-]{36}$/); assert.equal(saved.revision, 1); assert.equal(result.body.ownerEmail, undefined);
    const list = await request(app.getHttpServer()).get('/sites').set('Authorization', 'Bearer alice').expect(200); assert.equal(list.body[0].id, saved.id); assert.equal(list.body[0].name, 'Test venue');
  });
  it('isolates both reads and updates between accounts', async () => {
    const list = await request(app.getHttpServer()).get('/sites').set('Authorization', 'Bearer bob').expect(200); assert.deepEqual(list.body, []);
    await request(app.getHttpServer()).put(`/sites/${saved.id}`).set('Authorization', 'Bearer bob').send({ ...input(), revision: 1 }).expect(404);
  });
  it('persists edits and rejects stale revisions instead of overwriting them', async () => {
    const result = await request(app.getHttpServer()).put(`/sites/${saved.id}`).set('Authorization', 'Bearer alice').send({ ...input(), name: 'Updated venue', revision: 1 }).expect(200); assert.equal(result.body.revision, 2);
    await request(app.getHttpServer()).put(`/sites/${saved.id}`).set('Authorization', 'Bearer alice').send({ ...input(), revision: 1 }).expect(409);
    const list = await request(app.getHttpServer()).get('/sites').set('Authorization', 'Bearer alice'); assert.equal(list.body[0].name, 'Updated venue');
  });
  it('rejects malformed, incomplete and future observation geometry', async () => {
    const marker = { id: 'a', kind: 'entrance', name: 'Gate', coordinates: [[-.1, 51.5]], notes: '', verified: false };
    for (const feature of [{ ...marker, coordinates: [[200, 51.5]] }, { ...marker, kind: 'route' }, { ...marker, kind: 'boundary', coordinates: [[0, 0], [0, 0], [0, 0]] }, { ...marker, kind: 'crowd', count: 4, observedAt: '2099-01-01' }, { ...marker, kind: 'crowd', count: 4.5, observedAt: '2025-01-01' }]) await request(app.getHttpServer()).post('/sites').set('Authorization', 'Bearer alice').send({ ...input(), features: [feature] }).expect(400);
    assert.throws(() => parseSiteInput({ ...input(), features: [marker, marker] }));
  });
  it('retains feature timestamps when only planning notes change', async () => {
    const marker = { id: 'gate-1', kind: 'entrance', name: 'Gate', coordinates: [[151.2, -33.8]], notes: '', verified: true };
    const created = await request(app.getHttpServer()).post('/sites').set('Authorization', 'Bearer bob').send({ ...input(), latitude: -33.8, longitude: 151.2, features: [marker] }).expect(201);
    const updated = await request(app.getHttpServer()).put(`/sites/${created.body.id}`).set('Authorization', 'Bearer bob').send({ ...created.body, plan: { ...created.body.plan, actions: 'Review exits' } }).expect(200);
    assert.equal(updated.body.features[0].updatedAt, created.body.features[0].updatedAt);
    assert.deepEqual(updated.body.features[0].coordinates, [[151.2, -33.8]]);
  });
  it('saves and reopens incident and crowd observations, including a zero crowd count', async () => {
    const created = await request(app.getHttpServer()).post('/sites').set('Authorization', 'Bearer alice').send(input()).expect(201);
    const observedAt = new Date().toISOString();
    const features = [
      {id:'incident-1',kind:'incident',name:'Blocked exit',coordinates:[[-.1,51.5]],notes:'Needs review',verified:false,observedAt},
      {id:'crowd-1',kind:'crowd',name:'Assembly point',coordinates:[[-.1001,51.5001]],notes:'Empty after evacuation',verified:true,count:0,observedAt},
    ];
    const result = await request(app.getHttpServer()).put(`/sites/${created.body.id}`).set('Authorization','Bearer alice').send({...created.body,features}).expect(200);
    assert.equal(result.body.features.length,2);
    const reopened = await request(app.getHttpServer()).get('/sites').set('Authorization','Bearer alice').expect(200);
    const location = reopened.body.find(s=>s.id===created.body.id);
    assert.equal(location.features[0].kind,'incident');
    assert.equal(location.features[0].observedAt,observedAt);
    assert.equal(location.features[1].count,0);
    assert.deepEqual(location.features[1].coordinates,[[-.1001,51.5001]]);
    assert.ok(location.features.every(f=>f.source==='user'));
  });
  it('creates distinct workspaces and restores each camera, plan, CAD and viewer configuration', async () => {
    const a = (await request(app.getHttpServer()).post('/sites').set('Authorization','Bearer alice').send({...input(),name:'Workspace A',cad:{fileId:'drawing-a',name:'a.dwg'}}).expect(201)).body;
    const b = (await request(app.getHttpServer()).post('/sites').set('Authorization','Bearer alice').send({...input(),name:'Workspace B',latitude:-33.8,longitude:151.2}).expect(201)).body;
    assert.notEqual(a.id,b.id);
    assert.equal(a.configuration.mapProvider,'open-map');
    const changed = (await request(app.getHttpServer()).patch(`/sites/${a.id}/configuration`).set('Authorization','Bearer alice').send({cameraSource:'thermal',twinPreset:'compound',weatherHour:4,phoneFeeds:{phone_camera:'a'.repeat(32)}}).expect(200)).body;
    assert.deepEqual(changed.plan,a.plan); assert.deepEqual(changed.cad,a.cad);
    await request(app.getHttpServer()).patch(`/sites/${a.id}/configuration`).set('Authorization','Bearer alice').send({mapProvider:'google'}).expect(200);
    const list = (await request(app.getHttpServer()).get('/sites').set('Authorization','Bearer alice').expect(200)).body;
    const reopened = list.find(site=>site.id===a.id), untouched = list.find(site=>site.id===b.id);
    assert.equal(reopened.configuration.cameraSource,'thermal');assert.equal(reopened.configuration.twinPreset,'compound');assert.equal(reopened.configuration.mapProvider,'google');assert.equal(reopened.configuration.phoneFeeds.phone_camera,'a'.repeat(32));
    assert.equal(untouched.configuration.cameraSource,'video');assert.equal(untouched.configuration.weatherHour,0);assert.deepEqual(untouched.configuration.phoneFeeds,{});assert.equal(untouched.cad,undefined);
    await request(app.getHttpServer()).put(`/sites/${a.id}`).set('Authorization','Bearer alice').send({...a,plan:{...a.plan,actions:'Stale edit'}}).expect(409);
    const {configuration,...legacyInput}=reopened;
    const edited=(await request(app.getHttpServer()).put(`/sites/${a.id}`).set('Authorization','Bearer alice').send({...legacyInput,plan:{...a.plan,actions:'Reviewed'}}).expect(200)).body;
    assert.deepEqual(edited.configuration,reopened.configuration);
  });
  it('protects workspace settings across accounts and rejects invalid provider/camera settings', async () => {
    await request(app.getHttpServer()).patch(`/sites/${saved.id}/configuration`).send({cameraSource:'thermal'}).expect(401);
    await request(app.getHttpServer()).patch(`/sites/${saved.id}/configuration`).set('Authorization','Bearer bob').send({cameraSource:'thermal'}).expect(404);
    for (const patch of [{cameraSource:'https://untrusted.test'},{mapProvider:'unknown'},{weatherHour:-1},{weatherHour:1.5},{plan:{}},{phoneFeeds:{phone_camera:'invalid'}}])
      await request(app.getHttpServer()).patch(`/sites/${saved.id}/configuration`).set('Authorization','Bearer alice').send(patch).expect(400);
  });

});
