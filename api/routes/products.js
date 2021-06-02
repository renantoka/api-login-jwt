const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    //rejeitar um arquivo
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, false);
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage: storage,
    limites: {
        fileSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});

const Product = require('../models/product');

router.get('/', (req, res, next) => {
    Product.find()
        .select('name price _id productImage')
        .exec()
        .then(docs => {
            const response = {
                count: docs.length,
                products: docs.map(doc => {
                    return {
                        name: doc.name,
                        price: doc.price,
                        productImage: doc.productImage,
                        _id: doc._id,
                        request: {
                            type: 'GET',
                            url: 'http://localhost:3000/products' + doc._id
                        }
                    };
                })
            };
            /*  if (docs.length >= 0) { */
            res.status(200).json(docs);
            /* } else {
                res.status(404).json({
                    message: 'No entries found'
                })
            } */
        }).catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});

router.post('/', upload.single('productImage'), (req, res, next) => {
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        productImage: req.file.path
    });
    product.save()
        .then(result => {
            console.log(result);
            res.status(201).json({
                message: 'Created product successfully',
                createdProduct: {
                    name: result.name,
                    price: result.price,
                    _id: result.id,
                    description: result.description,
                    request: {
                        type: 'POST',
                        url: 'http://localhost:3000/products' + result._id
                    }
                }
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            })
        })

    router.get('/:productId', (req, res, next) => {
        const id = req.params.productId;
        Product.findById(id)
            .select('name price _id productImage')
            .exec()
            .then(doc => {
                console.log('From database', doc);
                if (doc) {
                    res.status(200).json({
                        product: doc,
                        request: {
                            type: 'GET',
                            description: 'Get all products',
                            url: 'http://localhost:3000/products'
                        }
                    });
                } else {
                    res.status(404).json({ message: 'No valid entry found for provided ID' })
                }

            })
            .catch(err => console.log(err));
        res.status(500).json({ error: err })
    });

    router.patch('/:productId', (req, res, next) => {
        const id = req.params.productId;
        const updateOps = {};
        for (const ops of req.body) {
            updateOps[ops.propName] = ops.value;
        }
        Product.update({ _id: id }, {
            $set: updateOps
        })
            .exec()
            .then(result => {
                res.status(200).json({
                    message: 'Product updated',
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/products/' + id
                    }
                });
            })
            .catch(err => {
                console.log(err);
                res.status(500).json({
                    error: err
                })
            });
    });

    router.delete('/:productId', (req, res, next) => {
        const id = req.params.productId;
        Product.remove({ _id: id })
            .exec()
            .then(result => {
                res.status(200).json({
                    message: 'Product deleted',
                    request: {
                        type: 'POST',
                        url: 'http://localhost:3000/products',
                        body: { name: 'String', price: 'Number', description: 'String' }
                    }
                });
            })
            .catch(err => console.log(err));
        res.status(500).json({ error: err });
    });
});

module.exports = router;