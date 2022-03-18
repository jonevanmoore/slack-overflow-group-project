const express = require('express');
const csrf = require('csurf');
const { check, validationResult } = require('express-validator');
const { Question, User, Answer, Vote } = require('../db/models');

const router = express.Router();

const csrfProtection = csrf({ cookie: true });
const asyncHandler = (handler) => (req, res, next) => handler(req, res, next).catch(next);

const answerValidator = [
    //TODO - NEED CUSTOME VALIDATOR TO MAKE ANSWER HAS VALUE
    check('body')
        .exists({ checkFalsy: true })
        .withMessage("Please add a valid input.")
]

router.post('/', csrfProtection, answerValidator, asyncHandler(async (req, res, next) => {
    const { question_id, body, image_link1, image_link2, image_link3 } = req.body

    const validateErrors = validationResult(req);

    if (req.session.auth) {
        if (validateErrors.isEmpty()) {
            const user_id = req.session.auth.userId
            const newAnswer = Answer.build({
                user_id,
                question_id,
                body,
                image_link1,
                image_link2,
                image_link3
            })
            await newAnswer.save()
            res.redirect(`/questions/${question_id}`)
        } else {
            const errors = validateErrors.array().map(error => error.msg);
            res.render(`/questions/${question_id}`, {})
            console.log("HERE WE ARE!")
        }
    } else {
        const error = new Error('Unauthenticated')
        error.status = 401
        next(error)
    }

}))

/* Old Delete Route
router.post(`/:id(\\d+)/delete`, async (req, res, next) => {
    const answer = await Answer.findByPk(Number(req.params.id))

    if (answer && req.session.auth && answer.user_id === req.session.auth.userId) {
        const questionId = answer.question_id
        await answer.destroy()
        res.redirect(`/questions/${questionId}`)
    } else {
        const error = new Error("Unauthorized")
        error.status = 403
        next(error)
    }

})
*/

// New DOM delete route
router.delete('/:id(\\d+)', async (req, res, next) => {
    const answer = await Answer.findByPk(Number(req.params.id))
    if( answer ){
      if (req.session.auth && answer.user_id === req.session.auth.userId) {
          const questionId = answer.question_id
          try {
            await answer.destroy()
            res.status(200);
            res.json();
          } catch(e) {
            res.status(500);
            res.json();
          }
      } else {
          res.status(403);
          res.json();
      }
    } else {
      res.status(404);
      res.json();
    }
     
})

router.put('/:id(\\d+)', async (req, res, next) => {
    const answer = await Answer.findByPk(Number(req.params.id))

    if (answer && req.session.auth && req.session.auth.userId === answer.user_id) {
        answer.body = req.body.content
        console.log(req.body)
        await answer.save()
        res.json({
            answer
        })
    } else {
        res.status(403)
        res.json({
            'message': 'unauthorized'
        })
    }
})



module.exports = router
