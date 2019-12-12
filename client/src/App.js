import React, { Component } from "react";
import { Button, Typography, Grid, TextField } from "@material-ui/core";
import { ThemeProvider } from "@material-ui/styles";

import MyContract from "./contracts/MyContract.json";
import ReactTooltip from 'react-tooltip'

import getWeb3 from "./utils/getWeb3";

import { theme } from "./utils/theme";
import logo from './assets/logo.png'
import Header from "./components/Header";

import "./App.css";

const GAS = 500000;
const GAS_PRICE = "20000000000";
const REQUEST_INFO_TEXT = `This will tie 4 location transactions for today's forecast to the Contract Surfer blockchain`

const getFeetFromResult = (result) => Number(result.slice(6, 8)) / 10

const INITIAL_LOCATION_STATE = {
  location1: "33.878727, -118.427179",
  location2: "33.148605, -117.353412",
  location3: "33.878727, -118.427179",
  location4: "33.148605, -117.353412"
}

class App extends Component {
  state = {
    web3: null,
    accounts: null,
    ...INITIAL_LOCATION_STATE,
    contract: null,
    resultReceived: false,
    result: "0"
  };

  componentDidMount = async () => {
    try {
      const web3 = await getWeb3();

      const accounts = await web3.eth.getAccounts();

      const networkId = await web3.eth.net.getId();
      if (networkId !== 3) {
        throw new Error("Select the Ropsten network from your MetaMask plugin");
      }
      const deployedNetwork = MyContract.networks[networkId];
      const contract = new web3.eth.Contract(
        MyContract.abi,
        deployedNetwork && deployedNetwork.address
      );

      this.setState({ web3, accounts, contract });

      window.ethereum.on("accountsChanged", async accounts => {
        const newAccounts = await web3.eth.getAccounts();
        this.setState({ accounts: newAccounts });
      });

      // Refresh on-chain data every 1 second
      const component = this;
      async function loopRefresh() {
        await component.refreshState();
        setTimeout(loopRefresh, 2000);
      }
      loopRefresh();
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }
  };

  getLocations = () => {
    const {location1, location2, location3, location4} = this.state
    return [location1, location2, location3, location4]
  }

  refreshState = async () => {
    const resultReceived = {}
    const result = {}
    const locations = this.getLocations()
    for (var i = 0; i < locations.length; i ++) {
      const received_i = await this.state.contract.methods.getResultReceived(i).call();
      const result_i = (await this.state.contract.methods.getResult(i).call()).toString();
      resultReceived[i] = received_i
      result[i] = result_i
    }
    this.setState({ resultReceived, result });
    // console.group('refresh', resultReceived, result)
  };

  handleUpdateForm = (name, value) => {
    this.setState({ [name]: value });
  };

  handleRequestResult = async () => {
    const locations = this.getLocations()
    // TODO: group into one transaction or make parallel.
    for (var i = 0; i < locations.length; i ++) { 
      console.log('requesting', locations[i], i)
      const requestId = await this.state.contract.methods.makeRequest(locations[i].toString(), i).send({ from: this.state.accounts[0], gas: GAS, gasPrice: GAS_PRICE });
      console.log('requested', requestId)
    }
  };

  handleResetResult = async () => {
    this.setState({...INITIAL_LOCATION_STATE})
    // await this.state.contract.methods
    //   .resetResult()
    //   .send({ from: this.state.accounts[0], gas: GAS, gasPrice: GAS_PRICE });
  };


  render() {
    if (!this.state.web3) {
      return (
        <ThemeProvider theme={theme}>
          <div className="App">
            <Header />

            <Typography>Loading Web3, accounts, and contract...</Typography>
          </div>
        </ThemeProvider>
      );
    }

    const {result, resultReceived} = this.state
    const locations = this.getLocations()
    const parsedResults = []
    locations.map((loc, i) => {
      if (result[i]) {
        parsedResults.push(parseFloat(getFeetFromResult(result[i])))
      }
    })
    const hasAllResults = Object.values(resultReceived || {}).every(x => x)
    console.log('parsed', parsedResults)
    const bestResult = Math.max(...parsedResults)
    return (
      <ThemeProvider theme={theme}>
        <ReactTooltip />
        <div className="App">
          <Header />

          <img src={logo} className='header-logo'/>
          <Typography variant="h5" style={{ marginTop: 32 }}>
            Market research powered on Blockchain.<br/>
            With just the cost of gas, use ChainLink to do a query against an email address for market research data.
          </Typography>
          <Grid>
          </Grid>
        </div>
      </ThemeProvider>
    );
  }
}

export default App;
