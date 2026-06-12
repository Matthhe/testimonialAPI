const Testimonial = require('../models/testimonial')
const User = require('../models/user')
const TestimonialSettings = require('../models/testimonialSettings');
const {VALID_TRANSITIONS, SHARE_CHANNELS} = require('../lib/constants')

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

        const allowedFields = [
            'customerName', 'customerEmail', 'customerPhone',
            'videoUrl', 'rating', 'text', 'consentGiven'
        ];
        const data = { userId: req.user.userId };
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) data[field] = req.body[field];
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

const updateStatus = async (req, res) => {
    try{
        const status = req.body.status
        const userId = req.user.userId;
        const testimonialId = req.params.testimonialId
        const testimonial = await Testimonial.findOne({testimonialId, isDeleted: false})
        if(!testimonial){
            return res.status(404).json({
                code: 404,
                status: "failure", 
                message: "Testimonial not found"
            })
        }
        if(testimonial.userId !== userId) return res.status(403).json({
                code: 403,
                status: "failure",
                message: "Forbidden"
        })

        if(!status) return res.status(400).json({
            code: 400,
            status: "failure",
            message: "Status is required"
        })

        const allowedTransitions = VALID_TRANSITIONS[testimonial.status]
        if(!allowedTransitions || !allowedTransitions.includes(status)){
            return res.status(400).json({
                code: 400,
                status: "failure",
                message: `Cannot transition from ${testimonial.status} to ${status}`
            })
        }
        testimonial.status = status;
            if (status === 'shared') {
                testimonial.sharedAt = new Date();
            }
        await testimonial.save();
        return res.status(200).json({ code: 200, status: 'success', message: 'Status updated', data: testimonial });
    }
    catch(err){
        console.error(err)
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

const remove = async (req, res) => {
    try{
        const userId = req.user.userId
        const testimonialId = req.params.testimonialId
        const testimonial = await Testimonial.findOne({testimonialId, isDeleted: false})
        if(!testimonial){
            return res.status(404).json({
                code: 404,
                status: "failure", 
                message: "Testimonial not found"
            })
        }
        if (testimonial.userId !== userId) {
            return res.status(403).json({
                code: 403,
                status: 'failure',
                message: 'Forbidden'
            });
        }

        testimonial.isDeleted = true;
        testimonial.deletedAt = new Date();
        await testimonial.save();

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Testimonial deleted'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code: 500,
            status: 'failure',
            message: 'Internal server error'
        });
    }
}

const share = async (req, res) => {
    try {
        const userId = req.user.userId;
        const testimonialId = req.params.testimonialId;
        const { channels } = req.body;

        if (!channels || !Array.isArray(channels) || channels.length === 0) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: 'Channels are required and must be a non-empty array'
            });
        }

        const invalidChannels = channels.filter(ch => !SHARE_CHANNELS.includes(ch));
        if (invalidChannels.length > 0) {
            return res.status(400).json({
                code: 400,
                status: 'failure',
                message: `Invalid channel(s): ${invalidChannels.join(', ')}`
            });
        }

        const testimonial = await Testimonial.findOne({ testimonialId, isDeleted: false });
        if (!testimonial) {
            return res.status(404).json({
                code: 404,
                status: 'failure',
                message: 'Testimonial not found'
            });
        }

        if (testimonial.userId !== userId) {
            return res.status(403).json({
                code: 403,
                status: 'failure',
                message: 'Forbidden'
            });
        }

        channels.forEach(channel => {
            if (!testimonial.sharedChannels.includes(channel)) {
                testimonial.sharedChannels.push(channel);
            }
        });

        if (testimonial.status === 'completed') {
            testimonial.status = 'shared';
        }

        if (!testimonial.sharedAt) {
            testimonial.sharedAt = new Date();
        }

        await testimonial.save();

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Testimonial shared successfully',
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

const getSettings = async (req, res) => {
    try{
        const userId = req.user.userId;
        const settings = await TestimonialSettings.findOne({userId})
        if(!settings) return res.status(200).json({
            code: 200,
            status: "success",
            message: "No settings found", 
            data: null
        })
        return res.status(200).json({
            code: 200,
            status: "success",
            message: "Data retrieved successfully",
            data: settings
        })
    } catch(err){
        console.error(err)
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
}

const updateSettings = async (req, res) => {
    try {
        const userId = req.user.userId;

        delete req.body.userId;

        const settings = await TestimonialSettings.findOneAndUpdate(
            { userId },
            { $set: req.body },
            { upsert: true, new: true, runValidators: true }
        );

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Settings saved',
            data: settings
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

const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { startDate, endDate } = req.query;

        const match = { userId, isDeleted: false };

        if (startDate || endDate) {
            match.createdAt = {};
            if (startDate) match.createdAt.$gte = new Date(startDate);
            if (endDate) match.createdAt.$lte = new Date(endDate);
        }

        const pipeline = [
            { $match: match },
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    averageRating: [
                        { $match: { rating: { $exists: true, $ne: null } } },
                        { $group: { _id: null, avg: { $avg: '$rating' } } }
                    ],
                    total: [
                        { $count: 'count' }
                    ]
                }
            },
            {
                $project: {
                    total: { $arrayElemAt: ['$total.count', 0] },
                    byStatus: 1,
                    averageRating: { $arrayElemAt: ['$averageRating.avg', 0] }
                }
            }
        ];

        const [result] = await Testimonial.aggregate(pipeline);

        const byStatusObj = {};
        if (result && result.byStatus) {
            result.byStatus.forEach(item => {
                byStatusObj[item._id] = item.count;
            });
        }

        const allStatuses = ['draft', 'recording', 'processing', 'completed', 'shared'];
        allStatuses.forEach(status => {
            if (!byStatusObj[status]) byStatusObj[status] = 0;
        });

        const data = {
            overview: {
                total: result ? result.total || 0 : 0,
                byStatus: byStatusObj,
                averageRating: result ? parseFloat((result.averageRating || 0).toFixed(1)) : 0
            },
            period: {
                startDate: startDate ? new Date(startDate).toISOString() : null,
                endDate: endDate ? new Date(endDate).toISOString() : null
            }
        };

        return res.status(200).json({
            code: 200,
            status: 'success',
            message: 'Data retrieved successfully',
            data
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

module.exports = { create, getAll, getOne, update, updateStatus, remove, share, getSettings, updateSettings, getAnalytics };