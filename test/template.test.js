const { template, validateReplacers } = require('../lib/template')

describe('template', () => {
  it('replaces $A with B', () => {
    const output = template('$A', { $A: 'B' })

    expect(output).toEqual('B')
  })

  it('replaces $MAJOR.$MINOR.$PATCH with 1.0.0', () => {
    const output = template('$MAJOR.$MINOR.$PATCH', {
      $MAJOR: 1,
      $MINOR: 0,
      $PATCH: 0,
    })

    expect(output).toEqual('1.0.0')
  })

  it('replaces $CHANGES but leaves $NEXT_PATCH_VERSION', () => {
    const input = `# v$NEXT_PATCH_VERSION
    ## CHANGES

    $CHANGES
    `
    const output = template(input, {
      $CHANGES: 'NO CHANGES',
    })

    expect(output).toEqual(expect.stringContaining('v$NEXT_PATCH_VERSION'))
    expect(output).toEqual(expect.stringContaining('NO CHANGES'))
  })

  it('nested template', () => {
    const output = template('$NEXT_MAJOR_VERSION', {
      $NEXT_MAJOR_VERSION: {
        $MAJOR: 1,
        $MINOR: 0,
        $PATCH: 0,
        $THIRD: {
          $NEST: 'THIRD LEVEL',
          template: '$NEST',
        },
        template: '$MAJOR.$MINOR.$PATCH.$THIRD',
      },
    })

    expect(output).toEqual('1.0.0.THIRD LEVEL')
  })
  it('single custom replacer', () => {
    const customReplacer = validateReplacers({
      replacers: [
        {
          search: '/\\bJENKINS-(\\d+)\\b/g',
          replace:
            '[https://issues.jenkins-ci.org/browse/JENKINS-$1](JENKINS-$1)',
        },
      ],
    })
    const output = template(
      'This is my body JENKINS-1234 JENKINS-1234 JENKINS-1234',
      {},
      customReplacer
    )

    expect(output).toEqual(
      'This is my body [https://issues.jenkins-ci.org/browse/JENKINS-1234](JENKINS-1234) [https://issues.jenkins-ci.org/browse/JENKINS-1234](JENKINS-1234) [https://issues.jenkins-ci.org/browse/JENKINS-1234](JENKINS-1234)'
    )
  })
  it('word custom replacer', () => {
    const customReplacer = validateReplacers({
      replacers: [
        {
          search: 'JENKINS',
          replace: 'heyyyyyyy',
        },
      ],
    })
    const output = template('This is my body JENKINS-1234', {}, customReplacer)

    expect(output).toEqual('This is my body heyyyyyyy-1234')
  })
  it('overlapping replacer', () => {
    const customReplacer = validateReplacers({
      replacers: [
        {
          search: 'JENKINS',
          replace: 'heyyyyyyy',
        },
        {
          search: 'heyyyyyyy',
          replace: 'something else',
        },
      ],
    })
    const output = template('This is my body JENKINS-1234', {}, customReplacer)

    expect(output).toEqual('This is my body something else-1234')
  })
  it('multiple custom replacer', () => {
    const customReplacer = validateReplacers({
      replacers: [
        {
          search: '/\\bJENKINS-(\\d+)\\b/g',
          replace:
            '[https://issues.jenkins-ci.org/browse/JENKINS-$1](JENKINS-$1)',
        },
        {
          search:
            '/\\[\\[https://issues.jenkins-ci.org/browse/JENKINS-(\\d+)\\]\\(JENKINS-(\\d+)\\)\\]/g',
          replace:
            '[https://issues.jenkins-ci.org/browse/JENKINS-$1](JENKINS-$1)',
        },
      ],
    })
    const output = template(
      'This is my body [JENKINS-1234] JENKINS-456',
      {},
      customReplacer
    )

    expect(output).toEqual(
      'This is my body [https://issues.jenkins-ci.org/browse/JENKINS-1234](JENKINS-1234) [https://issues.jenkins-ci.org/browse/JENKINS-456](JENKINS-456)'
    )
  })
  it('release tag replacer', () => {
    const output = template('$RELEASE_TAG', {
      $RELEASE_TAG: 'v1.0.0',
    })
    expect(output).toEqual('v1.0.0')
  })
  it('release name replacer', () => {
    const output = template('$RELEASE_NAME', {
      $RELEASE_NAME: 'hello world',
    })
    expect(output).toEqual('hello world')
  })
  it('release version replacer', () => {
    const output = template('$RELEASE_VERSION', {
      $RELEASE_VERSION: 'v2',
    })
    expect(output).toEqual('v2')
  })
  it('all version info replaced', () => {
    const tag = 2
    const version = `v${tag}`
    const name = `Beta release (${version})`

    const output = template(
      `tag: $RELEASE_TAG\nversion: $RELEASE_VERSION\nname: $RELEASE_NAME`,
      {
        $RELEASE_TAG: tag,
        $RELEASE_VERSION: version,
        $RELEASE_NAME: name,
      }
    )

    expect(output).toEqual(`tag: ${tag}\nversion: ${version}\nname: ${name}`)
  })
})
