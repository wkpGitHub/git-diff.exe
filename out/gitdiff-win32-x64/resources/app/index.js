const { app, BrowserWindow, Menu  } = require('electron')
const path = require('path')
const {execSync} = require('child_process');
const express = require('express')

Menu.setApplicationMenu(null);
const createWindow = () => {
  // 设置窗口最大化
  const win = new BrowserWindow({show: false, icon: path.resolve('./src/icon.png')}) 
  win.maximize() 
  win.show()

  win.loadFile('src/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})



const serverApp = express()

serverApp.use(require('express-body'))

serverApp.get('/branchs', (req, res) => {
  const {dir} = req.query
  const branchs = execSync('git branch -av', {
    cwd: path.join(dir.replace(/\\/g, '/'))
  }).toString()
  const branchList = branchs.split('\n')
  branchList.pop()

  const _data = branchList.map(item => ({
    b: item.split(/\s+/)[1],
    msg: ''
  }))

  const logs = execSync('git log -100', {
    cwd: path.join(dir.replace(/\\/g, '/'))
  }).toString()

  let currentLog = ''
  const logList = logs.split('\n')
  logList.forEach(item => {
    if (item.startsWith('commit')) {
      currentLog = item.split(' ')[1]
    }
    if (item.startsWith(' ')) {
      _data.push({
        b: currentLog,
        msg: `(${item.replace(/\\+/, '')})`
      })
    }
  })

  res.send({
    code: 200,
    data: _data
  })
})

serverApp.post('/comparison', (req, res) => {
  const {leftBranch, rightBranch, dir} = req.body
  if (leftBranch.startsWith('remotes')) {
    try {
      const arr = leftBranch.split('/')
      execSync(`git fetch ${arr[1]} ${arr[2]}`, {
        cwd: path.join(dir.replace(/\\/g, '/'))
      })
    }catch(err) {}
  }
  if (rightBranch.startsWith('remotes')) {
    try {
      const arr = rightBranch.split('/')
      execSync(`git fetch ${arr[1]} ${arr[2]}`, {
        cwd: path.join(dir.replace(/\\/g, '/'))
      })
    }catch(err) {}
  }
  const files = execSync(`git diff ${leftBranch} ${rightBranch} --stat=1000`, {
    cwd: path.join(dir.replace(/\\/g, '/'))
  }).toString()

  const filePathList = files.split('\n')
  filePathList.splice(filePathList.length - 2, 2)
  const fileList = filePathList.map(item => {
    let p = item.split(' ')
    return p[1]
  })
  res.send({
    code: 200,
    data: fileList
  })
})

serverApp.post('/getFileContent', (req ,res) => {
  const {leftBranch, rightBranch, dir, filePath} = req.body
  let leftFile = '', rightFile = '';
  try {
    leftFile = execSync(`git show ${leftBranch}:${filePath}`, {
      cwd: path.join(dir.replace(/\\/g, '/'))
    }).toString()
  }catch(err) {}
  try {
    rightFile = execSync(`git show ${rightBranch}:${filePath}`, {
      cwd: path.join(dir.replace(/\\/g, '/'))
    }).toString()
  }catch(err) {}

  res.send({
    code: 200,
    data: {leftFile, rightFile}
  })
})

serverApp.use('/', express.static('./src'))

serverApp.listen(13377)
