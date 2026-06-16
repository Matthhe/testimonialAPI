const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

process.env.NODE_ENV = 'test';
let mongoServer;
let token;
let testimonialId;

beforeAll(async () => {
    process.env.NODE_ENV = 'test'; 
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret-key';
    process.env.JWT_EXPIRY = '1h';

    await mongoose.connect(process.env.MONGODB_URI);

    const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com', password: '123456', businessName: 'Test Inc' });
    token = res.body.data.token;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Auth API', () => {
    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'new@test.com', password: 'abcdef', businessName: 'NewBiz' });
        expect(res.status).toBe(201);
        expect(res.body.data.token).toBeDefined();
    });

    it('should reject duplicate email', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@test.com', password: '123456', businessName: 'Dup' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/already registered/i);
    });

    it('should login successfully', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@test.com', password: '123456' });
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    it('should reject short password', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'short@test.com', password: '12345', businessName: 'Biz' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/at least 6/i);
    });
});

describe('Testimonials CRUD', () => {
    it('should create testimonial with allowed fields only (whitelist)', async () => {
        const res = await request(app)
            .post('/api/testimonials')
            .set('Authorization', `Bearer ${token}`)
            .send({
                customerName: 'Alice',
                rating: 5,
                text: 'Great!',
                status: 'shared',   
                isDeleted: true     
            });
        expect(res.status).toBe(201);
        expect(res.body.data.status).toBe('draft');
        expect(res.body.data.isDeleted).toBe(false);
        testimonialId = res.body.data.testimonialId;
    });

    it('should get list with pagination and filters', async () => {
        const res = await request(app)
            .get('/api/testimonials?page=1&limit=10&status=draft')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.pagination.total).toBeGreaterThanOrEqual(1);
        expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject invalid page/limit', async () => {
        const res = await request(app)
            .get('/api/testimonials?page=0&limit=200')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
    });

    it('should allow valid status transition', async () => {
        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'recording' });
        expect(res.status).toBe(200);
        expect(res.body.data.status).toBe('recording');
    });

    it('should reject invalid status transition', async () => {
        const res = await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'completed' }); 
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/cannot transition/i);
    });

    it('should share from completed and set sharedAt once', async () => {
        await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'processing' });
        await request(app)
            .patch(`/api/testimonials/${testimonialId}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'completed' });

        const shareRes = await request(app)
            .post(`/api/testimonials/${testimonialId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['email'] });
        expect(shareRes.status).toBe(200);
        expect(shareRes.body.data.status).toBe('shared');
        expect(shareRes.body.data.sharedAt).toBeTruthy();
        const firstShareDate = shareRes.body.data.sharedAt;

        const shareRes2 = await request(app)
            .post(`/api/testimonials/${testimonialId}/share`)
            .set('Authorization', `Bearer ${token}`)
            .send({ channels: ['facebook'] });
        expect(shareRes2.status).toBe(200);
        expect(shareRes2.body.data.sharedAt).toEqual(firstShareDate);
    });

    it('should not access other user testimonial (returns 403)', async () => {
        const uniqueEmail = `other_${Date.now()}@test.com`;
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({ email: uniqueEmail, password: 'abcdef', businessName: 'Other' });
        expect(regRes.status).toBe(201);
        const otherToken = regRes.body.data.token;

        const res = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${otherToken}`);
        expect(res.status).toBe(403);
    });

    it('should soft delete testimonial', async () => {
        const res = await request(app)
            .delete(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);

        const getRes = await request(app)
            .get(`/api/testimonials/${testimonialId}`)
            .set('Authorization', `Bearer ${token}`);
        expect(getRes.status).toBe(404);
    });
});

describe('Analytics', () => {
    it('should return analytics with correct structure', async () => {
        const res = await request(app)
            .get('/api/testimonials/analytics')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.data.overview.total).toBeGreaterThanOrEqual(0);
        expect(res.body.data.overview.byStatus).toHaveProperty('draft');
        expect(res.body.data.overview.byStatus).toHaveProperty('shared');
        expect(typeof res.body.data.overview.averageRating).toBe('number');
    });

    it('should reject invalid dates', async () => {
        const res = await request(app)
            .get('/api/testimonials/analytics?startDate=not-a-date')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
    });
});