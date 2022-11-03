/* global BigInt */

import React, { Component, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import TheWill from '../Contract/TheWill.json'

import { ethers } from "ethers";

import ERC20 from '../Contract/ERC20.json'
import { TheWillAddress, TokenAddress } from '../Utils/Constants';

class Wills extends Component {
    constructor(props) {
        super(props);
        this.state = {
            signer: null,
            signerAddress: '',
            tokenAddress: '',
            amount: '0',
            showConfirm: false,
            showAwait: false,
            showEdit: false,
            showEditTimeWhenWithdraw: false,
            showEditHeir: false,
            currentEditID: '',
            currentEditBaseHeirAddress: '',
            currentEditHeirAddress: '',
            currentEditTimeWhenWithdraw: '',
            currentEditTimeBetweenWithdrawAndStart: '',
            currentEditToken: '',
            currentEditSymbol: '',
            currentEditBaseAmount: '',
            currentEditAmount: '',
            updateHeir: false,
            updateAmount: false,
            time: '',
            network: '',
            approved: true,
            tokensValueToApprove: '',
            contractAddress: TheWillAddress,
            year: '',
            month: '',
            day: '',
            heirAddress: '',
            contract: null,
            wills: [],
            showError: false,
            errortext: '',
            notificationsOn: false
        };
    }

    componentDidMount = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            const network = await provider.getNetwork()
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner()
            const signerAddress = await signer.getAddress()
            const contract = new ethers.Contract(TheWillAddress, TheWill.abi, signer)
            const wills = await contract.getAllWills(signerAddress)
            let _wills = [];
            for (let i = 0; i < wills.length; i++) {
                const token = new ethers.Contract(wills[i].token, ERC20.abi, signer)
                const symbol = await token.symbol()
                console.log(wills[i].timeWhenWithdraw.toString())
                console.log(wills[i].timeBetweenWithdrawAndStart.toString())
                _wills[i] = {
                    ID: wills[i].ID.toString(),
                    amount: wills[i].amount.toString(),
                    done: wills[i].done,
                    heir: wills[i].heir,
                    owner: wills[i].owner,
                    timeWhenWithdraw: wills[i].timeWhenWithdraw.toString(),
                    timeBetweenWithdrawAndStart: wills[i].timeBetweenWithdrawAndStart.toString(),
                    token: wills[i].token,
                    symbol
                }
            }
            let networkName
            if (network.chainId === 56) {
                networkName = `BNB Chain`
            } else if (network.chainId === 137) {
                networkName = `Polygon`
            } else if (network.chainId === 31337) {
                networkName = `Hardhat`
            } else if (network.chainId === 80001) {
                networkName = `Mumbai`
            }
            this.setState({ signer, signerAddress, network: networkName, contract, wills: _wills })
            contract.on('AddAnHeir', async (ID,owner,heir,token,timeWhenWithdraw,amount) => {
                if (owner == signerAddress) {
                    let __wills = this.state.wills
                    const will = await contract.inheritanceData(ID.toString())
                    const token = new ethers.Contract(will.token, ERC20.abi, signer)
                    const symbol = await token.symbol()
                    let exist = false
                    for (let i = 0; i < __wills.length; i++) {
                        if (__wills[i].ID === will.ID.toString()) {
                            exist = true
                        }
                    }
                    if (exist == false) {
                        __wills.push({
                            ID: will.ID.toString(),
                            amount: will.amount.toString(),
                            done: will.done,
                            heir: will.heir,
                            owner: will.owner,
                            timeWhenWithdraw: will.timeWhenWithdraw.toString(),
                            timeBetweenWithdrawAndStart: will.timeBetweenWithdrawAndStart.toString(),
                            token: will.token,
                            symbol
                        })
                    }
                    this.setState({wills: __wills})
                }
            })
            contract.on('Withdraw', async (ID,owner, heir,timeWhenWithdraw) => {
                if (owner == signerAddress) {
                    let __wills = this.state.wills
                    __wills = __wills.filter(v => v.ID !== ID.toString())
                    this.setState({wills: __wills})
                }
            })
            contract.on('RemoveWill', async (ID, owner, heir) => {
                if (owner == signerAddress) {
                    let __wills = this.state.wills
                    __wills = __wills.filter(v => v.ID !== ID.toString())
                    this.setState({wills: __wills})
                }
            })
            contract.on('UpdateWillTimeWhenWithdraw', (ID, owner, heir, newTime) => {
                if (owner == signerAddress) {
                    let __wills = this.state.wills
                    for (let i = 0; i < __wills.length; i++) {
                        if (_wills[i].ID === ID.toString()) {
                            _wills[i].timeWhenWithdraw = newTime.toString()
                        }
                    }
                    this.setState({
                        wills: __wills
                    })
                }
            })
            contract.on('UpdateAnHeir', (ID, owner, heir) => {
                if (owner == signerAddress) {
                    let __wills = this.state.wills
                    for (let i = 0; i < __wills.length; i++) {
                        if (_wills[i].ID === ID.toString()) {
                            _wills[i].heir = heir
                        }
                    }
                    this.setState({
                        wills: __wills
                    })
                }
            })
            contract.on('UpdateAmount', (ID, owner, amount) => {
                if (owner == signerAddress) {
                    let __wills = this.state.wills
                    for (let i = 0; i < __wills.length; i++) {
                        if (_wills[i].ID === ID.toString()) {
                            _wills[i].amount = amount.toString()
                        }
                    }
                    this.setState({
                        wills: __wills
                    })
                }
            })
            contract.on('ResetTimers', (IDs, owner, newTimes) => {
                console.log(newTimes)
                if (owner == signerAddress) {
                    let __wills = this.state.wills
                    for (let i = 0; i < IDs.length; i++) {
                        for (let j = 0; j < __wills.length; j++) {
                            if (IDs[i].toString() === _wills[j].ID) {
                                _wills[j].timeWhenWithdraw = newTimes[i];
                            }
                        }
                    }
                    this.setState({
                        wills: __wills
                    })
                }
            })
        } catch (error) {
            console.error(error)
        }
    }

    timeConverter(UNIX_timestamp){
        var a = new Date(parseInt(UNIX_timestamp) * 1000);
        var year = a.getFullYear();
        var month = a.getMonth();
        var date = a.getDate();
        month+=1
        var time = `${date < 10 ? '0'+ date : date}` + '.' + `${month < 10 ? '0' + month : month}` + '.' + year;
        return time;
    }

    timeBetweenWithdrawAndStartConverter(time) {
        let seconds = parseInt(time)
        let y = Math.floor(seconds / 31536000);
        let mo = Math.floor((seconds % 31536000) / 2628000);
        let d = Math.floor(((seconds % 31536000) % 2628000) / 86400);
        let yDisplay = y > 0 ? y + (y === 1 ? " year " : " years ") : "";
        let moDisplay = mo > 0 ? mo + (mo === 1 ? " month " : " months ") : "";
        let dDisplay = d > 0 ? d + (d === 1 ? " day " : " days ") : "";
        return yDisplay + moDisplay + dDisplay
    }

    remainingTime(timeWhenWithdraw) {
        const _timeNow = new Date()
        const _timeWhenWithdraw = new Date(parseInt(timeWhenWithdraw) * 1000)
        if (_timeWhenWithdraw < _timeNow) {
            return 'Nothing.'
        } else {
            const seconds = Math.floor((new Date(_timeWhenWithdraw - _timeNow)).getTime() / 1000)
            let y = Math.floor(seconds / 31536000);
            let mo = Math.floor((seconds % 31536000) / 2628000);
            let d = Math.floor(((seconds % 31536000) % 2628000) / 86400);
            let h = Math.floor((seconds % (3600 * 24)) / 3600);
          
            let yDisplay = y > 0 ? y + (y === 1 ? " year, " : " years, ") : " 0 years,";
            let moDisplay = mo > 0 ? mo + (mo === 1 ? " month, " : " months, ") : " 0 months,";
            let dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : " 0 days, ";
            let hDisplay = h > 0 ? h + (h === 1 ? " hour " : " hours ") : " 0 hours";
            return yDisplay + moDisplay + dDisplay + hDisplay;
        }
    }

    async cancelWill(event) {
        try {
            const { contract } = this.state
            this.handleShowConfirm()
            await contract.removeWill(event.target.value)
                .then(async (tx) => {
                    this.handleShowAwait()
                    await tx.wait()
                    this.handleCloseAwait()
                })
        } catch (error) {
            console.error(error)
            this.handleCloseConfirm()
            this.handleCloseAwait()
        }
    }

    async editTimeWhenWithdraw() {
        try {
            const { currentEditID, contract, year, month, day } = this.state
            const secondsInADay = 86400
            let timeWhenWithdraw = (new Date()).getTime();
            timeWhenWithdraw = Math.round(timeWhenWithdraw / 1000) + year * 365 * secondsInADay + month * 30 * secondsInADay + day * secondsInADay;
            this.handleShowConfirm()
            await contract.updateWillTimeWhenWithdraw(currentEditID, timeWhenWithdraw)
                .then(async (tx) => {
                    this.handleShowAwait()
                    await tx.wait()
                    this.handleCloseAwait()
                    this.handleCloseEditTimeWhenWithdraw()
                    this.handleCloseEdit()
                    this.setState({
                        year: '',
                        month: '',
                        day: ''
                    })
                })
        } catch (error) {
            console.error(error)
            this.handleCloseConfirm()
            this.handleCloseAwait()
        }
    }

    async editHeir() {
        try {
            const { currentEditID, contract, heirAddress } = this.state
            this.handleShowConfirm()
            await contract.updateAnHeir(currentEditID, heirAddress)
                .then(async (tx) => {
                    this.handleShowAwait()
                    await tx.wait()
                    this.handleCloseAwait()
                    this.handleCloseEditHeir()
                    this.handleCloseEdit()
                })
        } catch (error) {
            console.error(error)
            this.handleCloseConfirm()
            this.handleCloseAwait()
        }
    }

    async edit() {
        try {
            const {
                currentEditAmount,
                currentEditHeirAddress,
                currentEditTimeWhenWithdraw,
                currentEditTimeBetweenWithdrawAndStart,
                currentEditID,
                year,
                month,
                day,
                updateHeir,
                updateAmount,
                time,
                contract
            } = this.state
            let _updatedTime = 0;
            let promise;
            if (year !== '' && month !== '' && day !== '') {
                let whenCreated = new Date((parseInt(currentEditTimeWhenWithdraw) - parseInt(currentEditTimeBetweenWithdrawAndStart)) * 1000)
                whenCreated = new Date(whenCreated.setFullYear(whenCreated.getFullYear()+parseInt(year)))
                whenCreated = new Date(whenCreated.setMonth(whenCreated.getMonth()+parseInt(month)))
                whenCreated = whenCreated.addDays(parseInt(day))
                _updatedTime = Math.floor(whenCreated.getTime() / 1000)
            }
            if (
                (year === '' && month !== '' && day !== '')
                ||
                (year !== '' && month === '' && day !== '')
                ||
                (year !== '' && month !== '' && day === '')
                ||
                (year === '' && month === '' && day !== '')
                ||
                (year !== '' && month === '' && day === '')
                ||
                (year === '' && month !== '' && day !== '')
            ) throw Error('If you want to change the time, enter all the input data, otherwise do not enter the input data')
            if (updateHeir === true && updateAmount === true && year !== '' && month !== '' && day !== '') {
                promise = contract.update(
                    currentEditID,
                    _updatedTime,
                    currentEditHeirAddress,
                    ethers.utils.parseEther(currentEditAmount),
                    true, //update time
                    true, //update heir
                    true  //update amount
                )
            }
            if (updateHeir === true && updateAmount === true && year === '' && month === '' && day === '') {
                promise = contract.update(
                    currentEditID,
                    _updatedTime,
                    currentEditHeirAddress,
                    ethers.utils.parseEther(currentEditAmount),
                    false,
                    true,
                    true
                )
            }
            if (updateHeir === true && updateAmount === false && year !== '' && month !== '' && day !== '') {
                promise = contract.update(
                    currentEditID,
                    _updatedTime,
                    currentEditHeirAddress,
                    ethers.utils.parseEther(currentEditAmount),
                    true, //update time
                    true, //update heir
                    false  //update amount
                )
            }
            if (updateHeir === true && updateAmount === false && year === '' && month === '' && day === '') {
                promise = contract.updateAnHeir(
                    currentEditID,
                    currentEditHeirAddress
                )
            }
            if (updateHeir === false && updateAmount === true && year !== '' && month !== '' && day !== '') {
                promise = contract.update(
                    currentEditID,
                    _updatedTime,
                    currentEditHeirAddress,
                    ethers.utils.parseEther(currentEditAmount),
                    true, //update time
                    false, //update heir
                    true  //update amount
                )
            }
            if (updateHeir === false && updateAmount === true && year === '' && month === '' && day === '') {
                promise = contract.updateAmount(
                    currentEditID,
                    ethers.utils.parseEther(currentEditAmount)
                )
            }
            if (updateHeir === false && updateAmount === false && year !== '' && month !== '' && day !== '') {
                promise = contract.updateWillTimeWhenWithdraw(
                    currentEditID,
                    _updatedTime
                )
            }
            if (updateHeir === false && updateAmount === false && year === '' && month === '' && day === '') throw Error('Nothing to update')
            this.handleShowConfirm()
            promise
            .then(async (tx) => {
                this.handleCloseConfirm()
                this.handleShowAwait()
                await tx.wait()
                .then(() => {
                    this.handleCloseAwait()
                    this.handleCloseEdit()
                })
            })
        } catch (error) {
            console.error(error)
            if (error.message.includes('Time is undefined')) {
                this.setState({
                    errortext: 'Выберите что делать со временем'
                })
                this.handleShowError()
            }
            if (error.message.includes('Nothing to update')) {
                this.setState({
                    errortext: 'Нет обновленных данных'
                })
                this.handleShowError()
            }
            if (error.message === `If you want to change the time, enter all the input data, otherwise do not enter the input data`) {
                this.setState({
                    errortext: 'Если вы хотите изменить время, введите все входные данные, в противном случае не вводите входные данные'
                })
                this.handleShowError()
            }
            this.handleCloseConfirm()
            this.handleCloseAwait()
            this.handleCloseEdit()
        }
    }

    async approve() {
        const { contractAddress, signer, amount, currentEditToken, currentEditBaseAmount, currentEditAmount } = this.state
        const _token = new ethers.Contract(currentEditToken, ERC20.abi, signer)
        const amountToApprove = ethers.utils.parseEther((parseFloat(currentEditAmount) - parseFloat(currentEditBaseAmount)).toString())
        this.handleShowConfirm()
        await _token.increaseAllowance(contractAddress, amountToApprove)
            .then(async (tx) => {
                this.handleShowAwait()
                await tx.wait()
                .then(() => {
                    this.handleCloseAwait()
                    this.setState({
                        approved: true
                    })
                })
            })
            .catch(err => {
                console.error(err)
                this.handleCloseConfirm()
                this.handleCloseAwait()
            })
    }

    onChangeYear(event) {
        this.setState({
            year: event.target.value
        })
    }

    onChangeMonth(event) {
        this.setState({
            month: event.target.value
        })
    }

    onChangeDay(event) {
        this.setState({
            day: event.target.value
        })
    }

    onChangeHeirAddress(event) {
        let updateHeir = false;
        if (this.state.currentEditBaseHeirAddress !== event.target.value) {
            updateHeir = true
        }
        this.setState({
            currentEditHeirAddress: event.target.value,
            updateHeir
        })
    }

    async onChangeAmount(event) {
        try {
            const { 
                contractAddress, 
                signer, 
                signerAddress, 
                tokensValue, 
                currentEditBaseAmount, 
                currentEditAmount, 
                currentEditToken 
            } = this.state
            if (parseFloat(currentEditBaseAmount) < parseFloat(event.target.value)) {
                this.setState({
                    currentEditAmount: event.target.value,
                    updateAmount: true
                })
                const _token = new ethers.Contract(currentEditToken, ERC20.abi, signer)
                const allowance = (await _token.allowance(signerAddress, contractAddress)).toString()
                this.changeApproved(allowance, (parseFloat(event.target.value) - parseFloat(currentEditBaseAmount)).toString())
            } 
            if (parseFloat(currentEditBaseAmount) > parseFloat(event.target.value)) {
                this.setState({
                    currentEditAmount: event.target.value,
                    approved: true,
                    updateAmount: true
                })
            }
            if (parseFloat(currentEditBaseAmount) === parseFloat(event.target.value)) {
                this.setState({
                    currentEditAmount: event.target.value,
                    approved: true,
                    updateAmount: false
                })
            }
        } catch (error) {
            console.error(error)
        }
    }


    onChangeTime(event) {
        this.setState({
            time: event.target.value
        })
    }

    changeApproved(allowance, amount) {
        try {
            if (parseInt(allowance) >= parseInt(ethers.utils.parseEther(amount)) && parseInt(allowance) !== 0) {
                this.setState({
                    approved: true
                })
            } else {
                this.setState({
                    approved: false
                })
            }
        } catch (error) {
            console.error(error.reason)
        }
    }

    async onSetHalfAmount() {
        const { contractAddress, signer, currentEditToken,signerAddress, tokensValue, amount } = this.state
        const _token = new ethers.Contract(currentEditToken, ERC20.abi, signer)
        await _token.balanceOf(signerAddress)
            .then((halfBalance) => {
                halfBalance = halfBalance / 2
                this.setState({
                    currentEditAmount: ethers.utils.formatEther(BigInt(halfBalance).toString())
                })
            })
    }

    async onSetMaxAmount() {
        const { contractAddress, signer, signerAddress, currentEditToken, tokensValue, amount } = this.state
        const _token = new ethers.Contract(currentEditToken, ERC20.abi, signer)
        await _token.balanceOf(signerAddress)
            .then((balance) => {
                this.setState({
                    currentEditAmount: ethers.utils.formatEther(BigInt(balance).toString())
                })
            })
    }

    onSetHalfAmount = this.onSetHalfAmount.bind(this)
    onSetMaxAmount = this.onSetMaxAmount.bind(this)

    approve = this.approve.bind(this)
    changeApproved = this.changeApproved.bind(this)
    onChangeAmount = this.onChangeAmount.bind(this)
    onChangeTime = this.onChangeTime.bind(this)
    cancelWill = this.cancelWill.bind(this)
    editTimeWhenWithdraw = this.editTimeWhenWithdraw.bind(this)
    editHeir = this.editHeir.bind(this)
    edit = this.edit.bind(this)
    onChangeYear = this.onChangeYear.bind(this)
    onChangeMonth = this.onChangeMonth.bind(this)
    onChangeDay = this.onChangeDay.bind(this)
    onChangeHeirAddress = this.onChangeHeirAddress.bind(this)

    handleCloseEdit = () => this.setState({
        showEdit: false, currentEditID: '',
        currentEditHeirAddress: '', currentEditTimeWhenWithdraw: ''
    });
    handleShowEdit = async (event) => {
        const { signer } = this.state
        const data = JSON.parse(event.target.value)
        this.setState({
            showEdit: true, 
            currentEditID: data.ID,
            currentEditHeirAddress: data.heir,
            currentEditBaseHeirAddress: data.heir,
            currentEditTimeWhenWithdraw: data.timeWhenWithdraw,
            currentEditTimeBetweenWithdrawAndStart: data.timeBetweenWithdrawAndStart,
            currentEditToken: data.token,
            currentEditSymbol: data.symbol,
            currentEditAmount: ethers.utils.formatEther(data.amount),
            currentEditBaseAmount: ethers.utils.formatEther(data.amount),
            year: '',
            month: '',
            day: '',
            
        })
    };

    changeNotifications() {
        this.setState({
            notificationsOn: this.state.notificationsOn === true ? false : true
        })
    }

    changeNotifications = this.changeNotifications.bind(this)

    handleCloseEdit = this.handleCloseEdit.bind(this)
    handleShowEdit = this.handleShowEdit.bind(this)

    handleShowConfirm = () => this.setState({showConfirm: true})
    handleShowAwait = () => this.setState({showConfirm: false, showAwait: true})
    handleCloseConfirm = () => this.setState({showConfirm: false})
    handleCloseAwait = () => this.setState({showAwait: false})
    handleShowConfirm = this.handleShowConfirm.bind(this)
    handleShowAwait = this.handleShowAwait.bind(this)
    handleCloseConfirm = this.handleCloseConfirm.bind(this)
    handleCloseAwait = this.handleCloseAwait.bind(this)

    timeConverter = this.timeConverter.bind(this)
    remainingTime = this.remainingTime.bind(this)
    
    handleShowError = () => this.setState({showError: true})
    handleCloseError = () => this.setState({showError: false})

    handleShowError = this.handleShowError.bind(this)
    handleCloseError = this.handleCloseError.bind(this)

    render() {
        return(
            <div id='wills'>
            <h3 className='block_your-wills-h3'>Your wills</h3>
            {
                this.state.wills.length > 0 
                ?
                <ul id='wills-list'>
                    {
                        this.state.wills.map((v) => {
                            return (
                                <li key={v.ID} className="your-wills">
                                    <div>
                                        <span>
                                            You bequeathed {ethers.utils.formatEther(v.amount)} of your {v.symbol} from {this.state.network} chain to wallet
                                        </span>
                                        <a href={`https://mumbai.polygonscan.com/address/${v.heir}`} target="_blank" rel="noreferrer">
                                            {` ${v.heir}`}
                                        </a>
                                    </div>
                                    <div>
                                        Inheritance can be harvest if the period of inactivity is longer than {this.timeBetweenWithdrawAndStartConverter(v.timeBetweenWithdrawAndStart)}
                                    </div>
                                    <div>
                                        ( Remain: {this.remainingTime(v.timeWhenWithdraw.toString())})
                                    </div>
                                    <button type="button" className="btn_btn-danger" value={
                                        JSON.stringify({
                                            ID: v.ID.toString(), 
                                            timeWhenWithdraw: v.timeWhenWithdraw.toString(),
                                            timeBetweenWithdrawAndStart: v.timeBetweenWithdrawAndStart.toString(),
                                            heir: v.heir, 
                                            token: v.token,
                                            symbol: v.symbol,
                                            amount: v.amount.toString()
                                        })
                                    } onClick={this.state.showEdit == false ? this.handleShowEdit : this.handleCloseEdit}>Edit</button>
                                    <button type="button" className="btn_btn-danger" value={v.ID.toString()} onClick={this.cancelWill}>Revoke</button>
                                </li>
                            )
                        })
                    }
                </ul>
                :
                <h4>У вас еще нет активных завещаний.</h4>
            }
            <Modal show={this.state.showEdit} onHide={this.handleCloseEdit}>
                <Modal.Header>
                <Modal.Title>Edit Will</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div>
                        Я завещаю мои
                    </div>
                    <div>{this.state.currentEditSymbol}</div>
                    <div>
                        <input onChange={this.onChangeAmount} value={this.state.currentEditAmount} className="input-group mb-3"/>
                        <Button variant="outline-success" onClick={this.onSetHalfAmount}>
                            half
                        </Button>
                        <Button variant="outline-success" onClick={this.onSetMaxAmount}>
                            max
                        </Button>
                    </div>
                    <div>С кошелька <a href='#'>{
                        this.state.signerAddress.slice(0, 6) + '...' + this.state.signerAddress.slice(this.state.signerAddress.length - 4, this.state.signerAddress.length)
                        }</a> на сети {this.state.network}</div>
                    <div>
                        Доверенному кошельку
                        <input onChange={this.onChangeHeirAddress} value={this.state.currentEditHeirAddress} className="input-group mb-3"/>
                    </div>
                    <div>
                        <div>
                        При условии что я буду неактивен(неактивна), начиная с момента создания наследства ({
                            this.timeConverter((parseInt(this.state.currentEditTimeWhenWithdraw) - parseInt(this.state.currentEditTimeBetweenWithdrawAndStart)).toString())
                            }) более чем:
                        </div>
                        <div>
                            <input type="number" onChange={this.onChangeYear} value={this.state.year} className="input-group-year"/>
                            <label >Лет</label><br/>
                            <input type="number" onChange={this.onChangeMonth} value={this.state.month} className="input-group-month"/>
                            <label >Месяцев</label><br/>
                            <input type="number" onChange={this.onChangeDay} value={this.state.day} className="input-group-days"/>
                            <label >Дней</label><br/>
                        </div>
                    </div>
                    <div>
                        <input type="checkbox" disabled={true} className="form-check-input mt-0"/>
                        <label >Add NFT Message (coming soon)</label><br/>
                        <input type="checkbox" disabled={true} className="form-check-input mt-0"/>
                        <label >Automatic token delivery (coming soon)</label><br/>
                        <input type="checkbox" onChange={this.changeNotifications} disabled={false} className="form-check-input mt-0"/>
                        <label >Notifications</label><br/>
                        <div style={this.state.notificationsOn === true ? {display: 'block'} : {display: 'none'}}>
                            <a href='https://t.me/thewill_bot' target="_blank" rel="noreferrer">Добавить оповещения вы можете в нашем телеграмм боте</a>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                <Button variant="primary" onClick={this.state.approved === true ? this.edit : this.approve}>
                    {this.state.approved === true ? `Edit` : `Approve`}
                </Button>
                <Button onClick={this.handleCloseEdit}>
                    Close
                </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={this.state.showConfirm}>
                <Modal.Header>
                    <div className="className='modal_confirm">
                        <div className="letter-holder">
                        <div className="l-1 letter">C</div>
                        <div className="l-2 letter">o</div>
                        <div className="l-3 letter">n</div>
                        <div className="l-4 letter">f</div>
                        <div className="l-5 letter">i</div>
                        <div className="l-6 letter">r</div>
                        <div className="l-7 letter">m</div>
                        <div className="l-8 letter">.</div>
                        <div className="l-9 letter">.</div>
                        <div className="l-10 letter">.</div>
                        </div>
                    </div>
                </Modal.Header>
                <Modal.Footer>
                    <Button variant="danger" onClick={this.handleCloseConfirm} className="btn btn-danger">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={this.state.showAwait}>
                <Modal.Header>
                    <div className="load-6">
                        <div className="letter-holder">
                        <div className="l-1 letter">A</div>
                        <div className="l-2 letter">w</div>
                        <div className="l-3 letter">a</div>
                        <div className="l-4 letter">i</div>
                        <div className="l-5 letter">t</div>
                        <div className="l-6 letter">.</div>
                        <div className="l-7 letter">.</div>
                        <div className="l-8 letter">.</div>
                        </div>
                    </div>
                </Modal.Header>
                <Modal.Footer>
                    <Button variant="danger" onClick={this.handleCloseAwait} className="btn btn-danger">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
            <Modal show={this.state.showError}>
                <Modal.Header>
                    <div>
                        <h1>Error</h1>
                        <div>{this.state.errortext}</div>
                    </div>
                </Modal.Header>
                <Modal.Footer>
                    <Button variant="danger" onClick={this.handleCloseError} className="btn btn-danger">
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
        )
    }
}

export default Wills;