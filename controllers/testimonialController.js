import Testimonial from "../models/testimonial"
import User from "../models/user";

const create = async (req, res) => {
    try {
        const { customerName } = req.body;

        if (!customerName) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'customerName is required.'
            });
        }

        const testimonial = new Testimonial({
            ...req.body,            
            userId: req.user.userId 
        });

        await testimonial.save();

        return res.status(201).json({
            code: 201,
            status: 'success',
            message: 'Testimonial created successfully.',
            data: testimonial
        });

    } catch (err) {
        console.error(err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: err.message
            });
        }
        return res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Internal server error'
        });
    }
};
const getAll = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { status, page = 1, limit = 10, sort = '-createdAt' } = req.query;

        const filter = { userId, isDeleted: false };
        if (status) filter.status = status;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const total = await Testimonial.countDocuments(filter);

        const testimonials = await Testimonial.find(filter)
            .sort(sort)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Data retrieved successfully',
            data: testimonials,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Internal server error'
        });
    }
};

const getOne = async (req, res) => {
    try{
        const userId = req.user.userId
        const testimonialId = req.params.testimonialId
        const testimonial = await Testimonial.findOne({testimonialId, isDeleted: false})
        if(!testimonial) return res.status(404).json({
            code: 404,
            status: "failure", 
            message: "Testimonial not found"
        })
        if(testimonial.userId !== userId) return res.status(403).json({
            code: 403,
            status: "failure",
            message: "Forbidden"
        })
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "Testimonial retrieved",
            data: testimonial
        })
        
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Internal server error'
        });
    }
}

const update = async (req, res) => {
    try{
        const userId = req.user.userId
        const testimonialId = req.params.testimonialId
        const testimonial = await Testimonial.findOne({testimonialId, isDeleted: false})
        if(!testimonial) return res.status(404).json({
            code: 404,
            status: "failure", 
            message: "Testimonial not found"
        })
        if(testimonial.userId !== userId) return res.status(403).json({
            code: 403,
            status: "failure",
            message: "Forbidden"
        })
        const allowedUpdates = ['customerName', 'customerEmail', 'customerPhone', 'videoUrl', 'rating', 'text', 'consentGiven'];
            allowedUpdates.forEach(field => {
                if (req.body[field] !== undefined) {
                    testimonial[field] = req.body[field];
                }
        });
        await testimonial.save()

        return res.status(200).json({
            code: 200,
            status: "success",
            message: "Testimonial updated",
            data: testimonial
        })
    }
    catch(err){
        console.error(err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                code: 400, 
                status: 'failure', 
                message: err.message });
        }
            return res.status(500).json({
                code: 500,
                status: 'failure',
                message: 'Internal server error'
            });
    }
}

module.exports = { create, getAll, getOne };