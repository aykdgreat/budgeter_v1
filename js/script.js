const {
   createApp,
   ref,
   computed,
   watch,
   onMounted
} = Vue

createApp({
   setup() {
      let isHistActive = ref(false)
      let isRecActive = ref(true)
      let isStatActive = ref(false)
      let isModalOpen = ref(false)

      const budget = ref([])
      const bal = ref(0)
      const inc = ref(0)
      const exp = ref(0)
      const sign = ref("#")

      const title = ref("")
      const amount = ref("")
      const type = ref("income")
      const date = ref("")
      const option = ref("cash")
      const msg = ref("")

      const histMonth = ref("")
      const histMonthWord = ref("")
      const monthInfo = ref([])
      const monthInfoData = ref([])
      const sortedMonthInfoData = ref([])
      const monthInc = ref([])
      const monthExp = ref([])

      const todayInfo = ref([])
      const yesterdayInfo = ref([])
      
      const monthBal = ref(0)
      const cashBal = ref(0)
      const acctBal = ref(0)
      const monthData =([])
      const isEditting = ref(null)
      const tempId = ref(0)
      
      const chart = ref("")
      const ratio = ref(0)
      const canvas = ref(document.createElement("canvas"))
      const ctx = ref(null)

      const recent = {
         today: ((new Date()).toISOString()).substr(0, 10),
         yesterday: (new Date(Date.now() - 86400000)).toISOString().substr(0, 10)
      }


      const setHistMonth = (val) => {
         const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
         if (val === undefined || val === "") {
            histMonth.value = new Date().getMonth() + 1
            histMonthWord.value = months[histMonth.value - 1]
         } else {
            histMonth.value = val
            histMonthWord.value = months[histMonth.value - 1]
         }
      }

      const handleSubmit = () => {
         if (!title.value || !amount.value || amount.value === 0 || !date.value) {
            msg.value = "All fields are required"
            return
         }
         msg.value = ""

         if(isEditting.value=== null) {
            
            budget.value.unshift({
               title: title.value,
               amount: parseInt(amount.value),
               type: type.value,
               date: date.value,
               option: option.value,
               created_at: Date.now()
            })
         } else {
            tempId.value = budget.value.findIndex(entry => entry.created_at === isEditting.value.created_at)
            budget.value[tempId.value].title = title.value
            budget.value[tempId.value].date = date.value
            budget.value[tempId.value].amount = amount.value
            budget.value[tempId.value].type = type.value
            budget.value[tempId.value].option = option.value
            isEditting.value = null
         }

         updateUI()
         localStorage.setItem("budget", JSON.stringify(budget.value))
         
         title.value = ""
         amount.value = ""
         type.value = "income"
         date.value = ""
         option.value = "cash"
         isModalOpen.value = false
      }

      let calcIncExp = (type, arr) => {
         let sum = 0

         arr.forEach(entry => {
            if (entry.type === type) {
               sum += entry.amount
            }
         })
         return sum
      }
      let calcOptionBal = (option, type, arr) => {
         let sum = 0

         arr.forEach(entry => {
            if (entry.option === option && entry.type === type) {
               sum += entry.amount
            }
         })
         return sum
      }

      const fetchMonthInfo = () => {
         setHistMonth(histMonth.value)
      
         monthInfo.value = budget.value.filter(entry => (new Date(entry.date)).getMonth() + 1 === histMonth.value) || []
         monthInc.value = calcIncExp("income", monthInfo.value)
         monthExp.value = calcIncExp("expense", monthInfo.value)
         monthBal.value = monthInc.value - monthExp.value

         monthInfoData.value = monthInfo.value.reduce((acc, current) => {
            const key = current.date;
            if (!acc[key]) {
               acc[key] = [];
            }
            acc[key].push(current);
            return acc;
         },
            {})

         sortedMonthInfoData.value = Object.entries(monthInfoData.value).sort((a, b) => { if (b < a) { return -1 } else if (b > a) { return 1 } else { return 0 } }).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
      }
      
      const deleteEntry = (timestamp) => {
         if(!confirm("Sure to delete?")) return
         
         budget.value = budget.value.filter(entry => entry.created_at !== parseInt(timestamp))
         updateUI()
         localStorage.setItem("budget", JSON.stringify(budget.value))
      }
      const editEntry = (id) => {
         if (!confirm("Edit entry?")) return
         isEditting.value = budget.value.find(entry => entry.created_at === id)
         title.value = isEditting.value.title
         amount.value = isEditting.value.amount
         type.value = isEditting.value.type
         date.value = isEditting.value.date
         option.value = isEditting.value.option
         isModalOpen.value = true
      }

      const updateUI = () => {
            monthData.value = budget.value.filter(entry => (new Date(entry.date)).getMonth() + 1 === (new Date()).getMonth() +1) || []
            inc.value = calcIncExp("income", monthData.value)
            exp.value = calcIncExp("expense", monthData.value)
            cashBal.value = (calcOptionBal("cash", "income", monthData.value) - calcOptionBal("cash", "expense", monthData.value))
            acctBal.value = (calcOptionBal("transfer", "income", monthData.value) - calcOptionBal("transfer", "expense", monthData.value))
            updateChart(inc.value, exp.value)
            
            todayInfo.value = budget.value.filter(entry => entry.date === recent.today) || []
            yesterdayInfo.value = budget.value.filter(entry => entry.date === recent.yesterday) || []
            fetchMonthInfo()
            sign.value = (inc.value >= exp.value) ? "#" : "- #"
            return bal.value = Math.abs(inc.value - exp.value)
         }
         
      const createChart = () => {
         
         canvas.value.width = 150
         canvas.value.height = 150
         
         chart.value.appendChild(canvas.value)
         
         ctx.value = canvas.value.getContext("2d")
         
         ctx.value.lineWidth = 20
      }
      
      function updateChart(inc, exp){

         ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
         
         ratio.value = inc / (inc+exp)

         ctx.value.strokeStyle = "#ffffff"
         ctx.value.beginPath()
         ctx.value.arc( canvas.value.width/2, canvas.value.height/2, 50, 0,( - ratio.value) * 2 * Math.PI, true)
         ctx.value.stroke()
         
         ctx.value.strokeStyle = "#f0624d"
         ctx.value.beginPath()
         ctx.value.arc( canvas.value.width/2, canvas.value.height/2, 50, 0,(1 - ratio.value) * 2 * Math.PI,false)
         ctx.value.stroke()
      }
/*
*/   

      onMounted(() => {
         setHistMonth()
         budget.value = localStorage.getItem("budget") ? JSON.parse(localStorage.getItem("budget")) : []
         createChart()
         updateUI()
      })


      return {
         isHistActive, isRecActive, isStatActive, isModalOpen,
         budget, sign, bal, inc, exp, title, amount, type, date, option,
         msg, handleSubmit, calcIncExp,
         setHistMonth, histMonth, fetchMonthInfo, monthInfo, monthInfoData, sortedMonthInfoData,
         monthInc, monthExp, histMonthWord, recent, todayInfo, yesterdayInfo,
         updateUI, deleteEntry, monthBal, calcOptionBal, cashBal, acctBal, monthData, editEntry,
         isEditting, createChart, chart
      }
   }
}).mount("#app")