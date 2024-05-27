
const checkEmailValidation = (email) => {
    const emailExpression = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      
      const isValidEmail = emailExpression.test(String(email).toLowerCase())
      if(!isValidEmail) {
          return false
      } else {
        return true
      }
}

module.exports = checkEmailValidation