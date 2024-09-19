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
      let isRatioActive = ref(false)
      let isModalOpen = ref(false)

      const budget = ref([])
      const bal = ref(0)
      const inc = ref(0)
      const exp = ref(0)
      const sign = ref("#")

      const title = ref("")
      const amount = ref("")
      const type = ref("income")
      const date = ref(new Date().toISOString().substring(0,10))
      const mode = ref("cash")
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
      
      const isCalcOpen = ref(false)
      const display = ref("")
      const op = ['+', '-', '*', '/']
      const prev = ref("")
      const selectedOp = ref("")
      
      const searchInput = ref("")

      const recent = {
         today: ((new Date()).toISOString()).substring(0, 10),
         yesterday: (new Date(Date.now() - 86400000)).toISOString().substring(0, 10)
      }

      const setHistMonth = (val) => {
         const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
         if (val === undefined || val === "") {
            histMonth.value = new Date().getMonth() + 1
            histMonthWord.value = new Date().toLocaleString('default', {month: 'long'})
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
               mode: mode.value,
               created_at: Date.now()
            })
         } else {
            tempId.value = budget.value.findIndex(entry => entry.created_at === isEditting.value.created_at)
            budget.value[tempId.value].title = title.value
            budget.value[tempId.value].date = date.value
            budget.value[tempId.value].amount = amount.value
            budget.value[tempId.value].type = type.value
            budget.value[tempId.value].mode = mode.value
            isEditting.value = null
         }

         updateUI()
         localStorage.setItem("budget", JSON.stringify(budget.value))
         
         resetFields()
         isModalOpen.value = false
      }
      
      const resetFields = () => {
         title.value = ""
         amount.value = ""
         type.value = "income"
         date.value = new Date().toISOString().substring(0,10)
         mode.value = "cash"
         isEditting.value = null
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
      let calcOptionBal = (mode, type, arr) => {
         let sum = 0

         arr.forEach(entry => {
            if (entry.mode === mode && entry.type === type) {
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
         
         let id = budget.value.findIndex(entry => entry.created_at === timestamp)
         budget.value.splice(id, 1)
         
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
         mode.value = isEditting.value.mode
         isModalOpen.value = true
      }

      const updateUI = () => {
            monthData.value = budget.value.filter(entry => (new Date(entry.date)).getMonth() + 1 === (new Date()).getMonth() +1) || []
            inc.value = calcIncExp("income", monthData.value)
            exp.value = calcIncExp("expense", monthData.value)
            cashBal.value = (calcOptionBal("cash", "income", monthData.value) - calcOptionBal("cash", "expense", monthData.value))
            acctBal.value = (calcOptionBal("account", "income", monthData.value) - calcOptionBal("account", "expense", monthData.value))
            updateChart(inc.value, exp.value)
            
            todayInfo.value = budget.value.filter(entry => entry.date === recent.today) || []
            yesterdayInfo.value = budget.value.filter(entry => entry.date === recent.yesterday) || []
            fetchMonthInfo()
            sign.value = (inc.value >= exp.value) ? "#" : "- #"
            bal.value = Math.abs(inc.value - exp.value)
            rollOver()
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
      
      const button = (value) => {
         if (value === 'c') {
            display.value = ""
            prev.value = ""
            selectedOp.value = ""
         } else if (value === 'd') {
            if(display.value.length > 0) {
               display.value = display.value.substr(0, display.value.length-1)
            }
         } else if (op.includes(value)) {
            calculate()
            prev.value = display.value
            display.value = ""
            selectedOp.value = value
         } else if (value === '=') {
            calculate()
         } else {
            display.value = display.value + value
         }
      }
      const calculate = () => {
            
            if (selectedOp.value === '+') {
               display.value = +prev.value + +display.value
            } else if (selectedOp.value === '-') {
               display.value = prev.value - display.value
            } else if (selectedOp.value === '*') {
               display.value = prev.value * display.value
            } else if (selectedOp.value === '/') {
               display.value = prev.value / display.value
            }
            
            prev.value = ""
            selectedOp.value = ""
         
      }
      
      const rollOver = (cashBalance, acctBalance) => {
         const month = new Date().getMonth() + 1
         const last = new Date(2024,month,0).getDate() // last day of the month
         const first = new Date(2024,month,1).getDate() // first day of the month
         
         if(new Date(Date.now()).getDate() === last) {
            let bal = {
               cash: cashBal.value,
               account: acctBal.value
            }
            localStorage.setItem('lastDayOfMonthBal', JSON.stringify(bal))
            console.log("Balance stored successfully", bal)
         } else if (new Date(Date.now()).getDate() === first) { //first
            // get localStorage and add new entry
            if (localStorage.getItem("lastDayOfMonthBal") !== 'undefined') { //04:30
               // calculate balance and save to var
               let bal = JSON.parse(localStorage.getItem('lastDayOfMonthBal'))
               console.log("Balance retrieved succesfully", bal)
               /*budget.value.unshift({
                  title: "Previous cash balance",
                  amount: bal.cash,
                  type: "income",
                  date: "2024-09-01",
                  mode: "cash",
                  created_at: Date.now()
               }   
               budget.value.unshift({
                  title: "Previous account balance",
                  amount: bal.account,
                  type: "income",
                  date: "2024-09-01",
                  mode: "account",
                  created_at: Date.now()
               })   */
               console.log(cashBal.value)
               cashBal.value += 3400
               console.log(cashBal.value)
               acctBal.value += 1500

               localStorage.setItem('budget', JSON.stringify(budget.value))
               //localStorage.removeItem('lastDayOfMonthBal')
               updateUI()
               // inc.value = 0
            }  //else {
                //console.log("Already retrieved :)");
             //}
         }
      }
      
      const searchBudget = () => {
         // sortedMonthInfoData.value.filter(obj => obj.title.includes(searchInput.value))
        if (searchInput.value !== "") {
            sortedMonthInfoData.value = Object.fromEntries(
               Object.entries(sortedMonthInfoData.value).filter(([key, value]) =>
                value.some(item => JSON.stringify(item.title.toLowerCase()).includes(searchInput.value.toLowerCase()))
               ).map(([key, value]) => [
                key,
                value.filter(item => JSON.stringify(item.title.toLowerCase()).includes(searchInput.value.toLowerCase()))])
            )
         } else {
            fetchMonthInfo()
         }
        /*
         */
         // console.log(result)
      }
      
      onMounted(() => {
         setHistMonth()
         budget.value = localStorage.getItem("budget") ? JSON.parse(localStorage.getItem("budget")) : []
         createChart()
         updateUI()
      })


      return {
         isHistActive, isRecActive, isRatioActive, isModalOpen,
         budget, sign, bal, inc, exp, title, amount, type, date, mode,
         msg, handleSubmit, calcIncExp,
         setHistMonth, histMonth, fetchMonthInfo, monthInfo, monthInfoData, sortedMonthInfoData,
         monthInc, monthExp, histMonthWord, recent, todayInfo, yesterdayInfo,
         updateUI, deleteEntry, monthBal, calcOptionBal, cashBal, acctBal, monthData, editEntry,
         isEditting, createChart, chart,
         isCalcOpen, display, button, prev, selectedOp,
         resetFields,
         searchInput, searchBudget
      }
   }
}).mount("#app")