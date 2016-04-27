window.Dismae.Parser = function (s) {
  var variables = {}
  var cursor = 0
  var script = s.split('\n')
  var functionTypes = {'out': 'Out', 'in': 'In', 'both': 'InOut'}

  function parseStatement () {
    var statement

    if (cursor >= script.length) {
      return false
    } else {
      while (cursor < script.length) {
        var line = script[cursor].trim()
        if (line) {
          console.log(line)
          var lineArray = line.split(' ')

          if (lineArray[0].charAt(0) === '"') {
            var narrationArray = line.split('"')
            console.log('narration statement: ', narrationArray[1])
            statement = {type: 'say', text: narrationArray[1]}
          } else if (lineArray[1] === '=') {
            var assignmentArray = line.split('=')
            variables[assignmentArray[0].trim()] = assignmentArray[1].trim()
            console.log('assignment: ', assignmentArray[0].trim(), ' -> ', assignmentArray[1].trim())
          } else if (lineArray[1].charAt(0) === '"') {
            var sayArray = line.split('"')
            var say = sayArray[0].trim()
            var text = sayArray[1].trim()
            say = variables[say] || say
            console.log('say statement: ', say, ' says ', text)
            statement = {type: 'say', say: say, text: text}
          } else if (lineArray[0] === 'show') {
            var showArray = line.split(' ')
            var show = variables[showArray[1]] || showArray[1]
            var log = `show statement: show ${showArray[1]}`

            statement = {type: 'show', show: show}

            var propertyIndex = 2
            while (propertyIndex < lineArray.length) {
              if (!statement.animate) {
                switch (lineArray[propertyIndex]) {
                  case 'at':
                    propertyIndex++
                    var at = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    if (at.includes(' ')) {
                      at = at.split(' ')
                      statement.x = at[0]
                      statement.y = at[1]
                    } else {
                      propertyIndex++
                      statement.x = at
                      statement.y = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]
                    }

                    log += ` at x:${statement.x} y:${statement.y}`
                    break
                  case 'opacity':
                    propertyIndex++
                    statement.alpha = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    log += ` opacity ${statement.opacity}`
                    break
                  case 'animate':
                    statement.animate = true
                    statement.to = {}

                    log += ' animate'
                    break
                }
              } else {
                switch (lineArray[propertyIndex]) {
                  case 'to':
                    propertyIndex++
                    var to = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    if (to.includes(' ')) {
                      to = to.split(' ')
                      statement.to.x = to[0]
                      statement.to.y = to[1]
                    } else {
                      propertyIndex++
                      statement.to.x = to
                      statement.to.y = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]
                    }

                    log += ` to x:${statement.to.x} y:${statement.to.y}`
                    break
                  case 'opacity':
                    propertyIndex++
                    statement.to.alpha = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    log += ` opacity ${statement.to.opacity}`
                    break
                  case 'over':
                    propertyIndex++
                    statement.over = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    log += ` over ${statement.over}`
                    break
                  case 'quadratic':
                    propertyIndex++
                    statement.function = {name: 'Quadratic', type: functionTypes[lineArray[propertyIndex]]}
                    log += ` function ${statement.function}`
                    break
                }
              }

              propertyIndex++
            }
            console.log(log)
          }
        }
        cursor++

        if (statement) {
          return statement
        }
      }

      return false
    }
  }

  return {
    script: script,
    parseStatement: parseStatement
  }
}
