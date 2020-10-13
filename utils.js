const { verify } = require('jsonwebtoken')

const getUserId = (req) => {
  console.log(process.env.JWT_SECRET);
  const Authorization = req.get('Authorization') || ''
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '')
    const verifiedToken = verify(token, process.env.JWT_SECRET)
    return verifiedToken.userId
  }
}

module.exports = { getUserId }
