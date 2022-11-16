import { ethers } from 'ethers';
import React, { Component } from 'react';
import Connect from '../Utils/Connect';

import Inheritances from '../Data/Inheritances';
import NewWill from './NewWill';
import { TheWillAddress } from '../Utils/Constants';
import TheWill from '../Contract/TheWill.json'

class Main extends Component {
    constructor(props) {
        super(props)
        this.state = {
            signer: null,
            willsLength: props.willsLength,
            contractAddress: TheWillAddress
        }
    }
    componentDidMount = async () => {
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner()

            this.setState({ signer })
        } catch (error) {
            console.error(error)
        }
    }

    async disconnect(account) {
        if (account !== null) {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner()
            this.setState({ signer })
        } else {
            this.setState({ signer: null })
        }
    }

    disconnect = this.disconnect.bind(this)

    render() {
        return(
            <div className='main-text'>
                <h1 className="block-one__title">Привет!</h1>
                <h3 className="block-one">Will - Первый полностью децентрализованный способ
завещать свою криптовалюту.</h3>
                <p className="block-two">С Will вы можете завещать любые ERC-20 токены со своего криптовалютного кошелька
на доверенные кошельки своих родных и близких
(или например на свой резервный кошелек)</p>
                <p className="block-two">Благодаря технологии смарт-контрактов Will работает полностью децентрализованно,
надежно и автономно. Ни у кого (вообще ни у кого, даже у команды проекта)
не будет доступа к средствам, которые вы завещали.&nbsp;<a href='#'>Подробнее о том, как это работает.</a></p>
                <p className="block-three">
                {
                    (this.state.willsLength === 0) && (this.state.signer !== null) 
                    ? 
                    'У вас еще нет активных завещаний.'
                    : 
                    'Чтобы создать свое первое завещание или управлять созданными подключите свой кошелек Ethereum'
                }
                </p>
                {
                    !window.ethereum ? <NewWill isEthereumNull={true}/> : null
                }
                {
                    this.state.signer === null ? <Connect disconnect={this.disconnect}/> : <NewWill isEthereumNull={false}/>
                }
                {
                    this.props.inheritancesLength === 0 ? '' : <Inheritances/>
                }
            </div>
        )
    }
}

export default Main