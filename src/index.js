new Vue({
  el: '#app',
  data: {
    gitDir: '',
    diffHtml: '',
    leftBranch: '',
    rightBranch: '',
    branchList: [],
    fileList: [],
    activeItem: '',
    contentLoading: false,
    comparisonLoading: false,
    branchLoading: false,
  },
  created() {
    
  },
  methods: {
    getBranch() {
      this.branchLoading = true
      axios.get('http://localhost:13377/branchs?dir='+this.gitDir).then(({data}) => {
        this.branchList = data.data || []
      }).finally(() => this.branchLoading = false)
    },
    comparison() {
      this.comparisonLoading=true
      axios.post('http://localhost:13377/comparison', {
        dir: this.gitDir,
        leftBranch: this.leftBranch,
        rightBranch: this.rightBranch
      }).then(({data}) => {
        this.fileList = data.data || []
      }).finally(() => this.comparisonLoading = false)
    },
    comparisonFile(filePath, oldData, newData) {
      let oldDataLines = oldData.split('\n').length,
          newDataLines = newData.split('\n').length
      
      const diffStr = Diff.createPatch(filePath, oldData, newData, '', '', {
        context: Math.max(oldDataLines, newDataLines) // 显示多少行差异
      })
      const diffJson = Diff2Html.parse(diffStr)
      this.diffHtml = Diff2Html.html(diffJson, {
        drawFileList: false,
        outputFormat: 'side-by-side' // line-by-line
      })
    },
    getFileContent(filePath) {
      this.activeItem = filePath
      this.contentLoading = true
      axios.post('http://localhost:13377/getFileContent', {
        filePath,
        dir: this.gitDir,
        leftBranch: this.leftBranch,
        rightBranch: this.rightBranch
      }).then(({data}) => {
        const {leftFile, rightFile} = data.data
        this.comparisonFile(filePath, leftFile, rightFile)
      }).finally(() => this.contentLoading = false)
    }
  }
})