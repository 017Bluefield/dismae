window.Dismae.Parser = function (s) {
  var variables = {}
  var statementCursor = 0
  var assetCursor = 0
  var script = s.split('\n')
  var functionTypes = {'out': 'Out', 'in': 'In', 'both': 'InOut', 'none': 'None'}
  var seenAssets = {}

  // return the next referenced asset for caching purposes
  function nextAsset () {
    var result

    do {
      result = parseStatement(assetCursor)
      assetCursor = result.cursor
    } while (
      result.statement &&
      result.statement.type !== 'show' &&
      result.statement.type !== 'change' &&
      result.statement.type !== 'play' &&
      result.statement.type !== 'button'
    )

    if (result.statement) {
      // note: we keep track of seen asset types for the purposes
      // of returning the correct load command for a change statement
      if (result.statement.type === 'show') {
        seenAssets[result.statement.show] = 'image'
        return { asset: result.statement.show, type: 'image' }
      } else if (result.statement.type === 'change') {
        seenAssets[result.statement.change.to] = seenAssets[result.statement.change.from]
        return { asset: result.statement.change.to, type: seenAssets[result.statement.change.from] }
      } else if (result.statement.type === 'play') {
        seenAssets[result.statement.play] = 'audio'
        return { asset: result.statement.play, type: 'audio' }
      } else if (result.statement.type === 'button') {
        seenAssets[result.statement.button] = 'atlas'
        return { asset: result.statement.button, atlas: result.statement.atlas, type: 'atlas' }
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

  function parseProperties (statement, propertiesArray, propertyIndex) {
    var at
    var to

    while (propertyIndex < propertiesArray.length) {
      // animatable properties
      if (!statement.animate) {
        switch (propertiesArray[propertyIndex]) {
          case 'at':
            propertyIndex++
            at = variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex]

            if (at.includes(' ')) {
              at = at.split(' ')
              statement.x = Number(at[0])
              statement.y = Number(at[1])
            } else {
              propertyIndex++
              statement.x = Number(at)
              statement.y = Number(variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex])
            }

            break
          case 'opacity':
            propertyIndex++
            statement.alpha = Number(variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex])
            break
          case 'animate':
            statement.animate = true
            statement.to = {}
            break
          case 'as':
            propertyIndex++
            statement.as = variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex]
            break
          case 'volume':
            propertyIndex++
            statement.volume = Number(variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex])
            break
        }
      } else {
        switch (propertiesArray[propertyIndex]) {
          case 'to':
            propertyIndex++
            to = variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex]

            if (to.includes(' ')) {
              to = to.split(' ')
              statement.to.x = Number(to[0])
              statement.to.y = Number(to[1])
            } else {
              propertyIndex++
              statement.to.x = Number(to)
              statement.to.y = Number(variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex])
            }

            break
          case 'opacity':
            propertyIndex++
            statement.to.alpha = Number(variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex])
            break
          case 'volume':
            propertyIndex++
            statement.to.volume = Number(variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex])
            break
          case 'over':
            propertyIndex++
            statement.over = Number(variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex])
            break
          case 'quadratic':
            propertyIndex++
            statement.function = {name: 'Quadratic', type: functionTypes[propertiesArray[propertyIndex]]}
            break
          case 'linear':
            propertyIndex++
            statement.function = {name: 'Linear', type: functionTypes[propertiesArray[propertyIndex]]}
            break
          case 'chained':
            statement.chained = true
            break
        }
      }

      // unanimatable properties
      switch (propertiesArray[propertyIndex]) {
        case 'execute':
          propertyIndex++
          statement.execute = variables[propertiesArray[propertyIndex]] || propertiesArray[propertyIndex]
          break
        case 'loop':
          statement.loop = true
          break
      }

      propertyIndex++
    }

    return statement
  }

  function parseStatement (cursor) {
    var statement

    if (cursor >= script.length) {
      return {statement: false, cursor: cursor}
    } else {
      while (cursor < script.length) {
        var line = script[cursor].trim()
        if (line) {
          var lineArray = line.split(' ')
          var tokenizedArray

          if (lineArray[0].charAt(0) === '"') {
            tokenizedArray = line.split('"')
            statement = {type: 'say', say: '', text: tokenizedArray[1]}
          } else if (lineArray[1] === '=') {
            tokenizedArray = line.split('=')
            variables[tokenizedArray[0].trim()] = tokenizedArray[1].trim()
          } else if (lineArray[1].charAt(0) === '"') {
            tokenizedArray = line.split('"')
            var say = tokenizedArray[0].trim()
            var text = tokenizedArray[1].trim()
            say = variables[say] || say
            statement = {type: 'say', say: say, text: text}
          } else if (lineArray[0] === 'show') {
            tokenizedArray = line.split(' ')
            var show = variables[tokenizedArray[1]] || tokenizedArray[1]

            statement = {type: 'show', show: show}
            statement = parseProperties(statement, tokenizedArray, 2)
          } else if (lineArray[0] === 'hide') {
            tokenizedArray = line.split(' ')
            var hide = variables[tokenizedArray[1]] || tokenizedArray[1]

            statement = {type: 'hide', hide: hide}
            statement = parseProperties(statement, tokenizedArray, 2)
          } else if (lineArray[0] === 'change') {
            tokenizedArray = line.split(' ')
            var change = {
              from: variables[tokenizedArray[1]] || tokenizedArray[1],
              to: variables[tokenizedArray[3]] || tokenizedArray[3]
            }

            statement = {type: 'change', change: change}
            statement = parseProperties(statement, tokenizedArray, 4)
          } else if (lineArray[0] === 'play') {
            tokenizedArray = line.split(' ')
            var play = variables[tokenizedArray[1]] || tokenizedArray[1]

            statement = {type: 'play', play: play}
            statement = parseProperties(statement, tokenizedArray, 2)
          } else if (lineArray[0] === 'stop') {
            tokenizedArray = line.split(' ')
            var stop = variables[tokenizedArray[1]] || tokenizedArray[1]

            statement = {type: 'stop', stop: stop}
            statement = parseProperties(statement, tokenizedArray, 2)
          } else if (lineArray[0] === 'button') {
            tokenizedArray = line.split(' ')
            var button = variables[tokenizedArray[1]] || tokenizedArray[1]
            var atlas = variables[tokenizedArray[2]] || tokenizedArray[2]

            statement = {type: 'button', button: button, atlas: atlas}
            statement = parseProperties(statement, tokenizedArray, 3)
          } else if (lineArray[0] === 'wait') {
            tokenizedArray = line.split(' ')
            var time = variables[tokenizedArray[1]] || tokenizedArray[1]

            statement = {type: 'wait', time: time}
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
