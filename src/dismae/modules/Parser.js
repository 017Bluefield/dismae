window.Dismae.Parser = function (s) {
  var variables = {}
  var statementCursor = 0
  var assetCursor = 0
  var script = s.split('\n')
  var functionTypes = {'out': 'Out', 'in': 'In', 'both': 'InOut'}

  // return the next referenced asset for caching purposes
  function nextAsset () {
    var result

    do {
      result = parseStatement(assetCursor)
      assetCursor = result.cursor
    } while (result.statement && result.statement.type !== 'show' && result.statement.type !== 'change')

    if (result.statement) {
      if (result.statement.type === 'show') {
        return result.statement.show
      } else if (result.statement.type === 'change') {
        return result.statement.change.to
      }
    } else {
      return false
    }
  }

  function nextStatement () {
    var result = parseStatement(statementCursor)
    statementCursor = result.cursor
    return result.statement
  }

  function parseStatement (cursor) {
    var statement
    var log
    var propertyIndex
    var at
    var to

    if (cursor >= script.length) {
      return {statement: false, cursor: cursor}
    } else {
      while (cursor < script.length) {
        var line = script[cursor].trim()
        if (line) {
          // console.log(line)
          var lineArray = line.split(' ')

          if (lineArray[0].charAt(0) === '"') {
            var narrationArray = line.split('"')
            // console.log('narration statement: ', narrationArray[1])
            statement = {type: 'say', say: '', text: narrationArray[1]}
          } else if (lineArray[1] === '=') {
            var assignmentArray = line.split('=')
            variables[assignmentArray[0].trim()] = assignmentArray[1].trim()
            // console.log('assignment: ', assignmentArray[0].trim(), ' -> ', assignmentArray[1].trim())
          } else if (lineArray[1].charAt(0) === '"') {
            var sayArray = line.split('"')
            var say = sayArray[0].trim()
            var text = sayArray[1].trim()
            say = variables[say] || say
            // console.log('say statement: ', say, ' says ', text)
            statement = {type: 'say', say: say, text: text}
          } else if (lineArray[0] === 'show') {
            var showArray = line.split(' ')
            var show = variables[showArray[1]] || showArray[1]
            log = `show statement: show ${showArray[1]}`

            statement = {type: 'show', show: show}

            propertyIndex = 2
            while (propertyIndex < lineArray.length) {
              if (!statement.animate) {
                switch (lineArray[propertyIndex]) {
                  case 'at':
                    propertyIndex++
                    at = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    if (at.includes(' ')) {
                      at = at.split(' ')
                      statement.x = Number(at[0])
                      statement.y = Number(at[1])
                    } else {
                      propertyIndex++
                      statement.x = Number(at)
                      statement.y = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])
                    }

                    log += ` at x:${statement.x} y:${statement.y}`
                    break
                  case 'opacity':
                    propertyIndex++
                    statement.alpha = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])

                    log += ` opacity ${statement.alpha}`
                    break
                  case 'animate':
                    statement.animate = true
                    statement.to = {}

                    log += ' animate'
                    break
                  case 'as':
                    propertyIndex++
                    statement.as = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    log += ` as ${statement.as}`
                    break
                }
              } else {
                switch (lineArray[propertyIndex]) {
                  case 'to':
                    propertyIndex++
                    to = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                    if (to.includes(' ')) {
                      to = to.split(' ')
                      statement.to.x = Number(to[0])
                      statement.to.y = Number(to[1])
                    } else {
                      propertyIndex++
                      statement.to.x = Number(to)
                      statement.to.y = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])
                    }

                    log += ` to x:${statement.to.x} y:${statement.to.y}`
                    break
                  case 'opacity':
                    propertyIndex++
                    statement.to.alpha = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])

                    log += ` opacity ${statement.to.alpha}`
                    break
                  case 'over':
                    propertyIndex++
                    statement.over = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])

                    log += ` over ${statement.over}`
                    break
                  case 'quadratic':
                    propertyIndex++
                    statement.function = {name: 'Quadratic', type: functionTypes[lineArray[propertyIndex]]}
                    log += ` function ${statement.function.name}, type ${statement.function.type}`
                    break
                }
              }

              propertyIndex++
            }
            // console.log(log)
          } else if (lineArray[0] === 'hide') {
            var hideArray = line.split(' ')
            var hide = variables[hideArray[1]] || hideArray[1]
            log = `hide statement: hide ${hideArray[1]}`

            statement = {type: 'hide', hide: hide}

            propertyIndex = 2
            while (propertyIndex < lineArray.length) {
              switch (lineArray[propertyIndex]) {
                case 'animate':
                  statement.animate = true
                  statement.to = {}

                  log += ' animate'
                  break
                case 'to':
                  propertyIndex++
                  to = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                  if (to.includes(' ')) {
                    to = to.split(' ')
                    statement.to.x = Number(to[0])
                    statement.to.y = Number(to[1])
                  } else {
                    propertyIndex++
                    statement.to.x = Number(to)
                    statement.to.y = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])
                  }

                  log += ` to x:${statement.to.x} y:${statement.to.y}`
                  break
                case 'opacity':
                  propertyIndex++
                  statement.to.alpha = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])

                  log += ` opacity ${statement.to.alpha}`
                  break
                case 'over':
                  propertyIndex++
                  statement.over = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])

                  log += ` over ${statement.over}`
                  break
                case 'quadratic':
                  propertyIndex++
                  statement.function = {name: 'Quadratic', type: functionTypes[lineArray[propertyIndex]]}
                  log += ` function ${statement.function.name}, type ${statement.function.type}`
                  break
              }

              propertyIndex++
            }
            // console.log(log)
          } else if (lineArray[0] === 'change') {
            var changeArray = line.split(' ')
            var change = {
              from: variables[changeArray[1]] || changeArray[1],
              to: variables[changeArray[3]] || changeArray[3]
            }
            log = `change statement: change ${change.from} to ${change.to}`

            statement = {type: 'change', change: change}

            propertyIndex = 4
            while (propertyIndex < lineArray.length) {
              switch (lineArray[propertyIndex]) {
                case 'animate':
                  statement.animate = true
                  statement.to = {}

                  log += ' animate'
                  break
                case 'to':
                  propertyIndex++
                  to = variables[lineArray[propertyIndex]] || lineArray[propertyIndex]

                  if (to.includes(' ')) {
                    to = to.split(' ')
                    statement.to.x = Number(to[0])
                    statement.to.y = Number(to[1])
                  } else {
                    propertyIndex++
                    statement.to.x = Number(to)
                    statement.to.y = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])
                  }

                  log += ` to x:${statement.to.x} y:${statement.to.y}`
                  break
                case 'opacity':
                  propertyIndex++
                  statement.to.alpha = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])

                  log += ` opacity ${statement.to.alpha}`
                  break
                case 'over':
                  propertyIndex++
                  statement.over = Number(variables[lineArray[propertyIndex]] || lineArray[propertyIndex])

                  log += ` over ${statement.over}`
                  break
                case 'quadratic':
                  propertyIndex++
                  statement.function = {name: 'Quadratic', type: functionTypes[lineArray[propertyIndex]]}
                  log += ` function ${statement.function.name}, type ${statement.function.type}`
                  break
              }

              propertyIndex++
            }
            // console.log(log)
          }
        }
        cursor++

        if (statement) {
          return {statement: statement, cursor: cursor}
        }
      }

      return {statement: false, cursor: cursor}
    }
  }

  return {
    parseStatement: parseStatement,
    nextStatement: nextStatement,
    nextAsset: nextAsset
  }
}
