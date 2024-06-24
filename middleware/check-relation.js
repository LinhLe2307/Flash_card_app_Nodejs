const checkMedia = (x, linkedin, instagram, github, website) => {
    if (!x.length && !linkedin.length && !instagram.length && !github.length && !website.length) {
        return false
    }
    return true
}

exports.checkMedia = checkMedia