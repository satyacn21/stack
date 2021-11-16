import React, { Component } from "react";
import { connect } from "react-redux";
import axios from "axios";
import { withRouter, Link } from "react-router-dom";
import { setData } from "../../../actions/actions";
import { api, trackEvent, axiosx } from "../../../utils";
import * as endPoints from "../../../js/constants";
import LogoMaiBreathing from "../../../images/Gifs/Logo Mai Breathing.gif";
import SplashHiIamMAI from "../../../images/Gifs/maisplash.gif";
import Fade from "react-reveal/Fade";
import stateDropdown from "../../../images/stateDropdown.png";
import tickicongreen from "../../../images/icons/icon-tick-green.png";
import BackButtonHeader from "../../common/CardList/v7.0/BackButtonHeader";
import parentof from "../../../images/Gifs/parentof.png";

var $;

class PhonePage extends Component {
  constructor(props) {
    super(props);
    var mobileData = JSON.parse(sessionStorage.getItem("mobileData"));
    var isError = JSON.parse(sessionStorage.getItem("isError"));
    this.state = {
      phone:
        mobileData && mobileData.mobileNumber ? mobileData.mobileNumber : "",
      isdcode:
        mobileData && mobileData.countryCode ? mobileData.countryCode : "+91",
      errorData: isError && isError.error ? isError.error : "",
      displayMenu: false,
      selected: mobileData && mobileData.selected ? mobileData.selected : 0,
      countryCodes: [],
      formData: "",
      errors: "",
      initialClick: false,
      enableNextbtn: false,
      ipAddress: "",
    };
    this.hideDropdownMenu = this.hideDropdownMenu.bind(this);
  }

  getDeviceType = () => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad)|Android|iP(hone|od)/i.test(ua)) {
      return "App";
    }
    // if (
    //   /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
    //     ua
    //   )
    // ) {
    //   return "mobile";
    // }
    // if (/Android/.test(ua)) {
    //   return "Android";
    // }
    // if (/iP(hone|od)/.test(ua)) {
    //   return "iOS";
    // }
    return "Web";
  };

  showDropdownMenu(event) {
    event.preventDefault();
    this.setState({ displayMenu: true }, () => {
      document.addEventListener("click", this.hideDropdownMenu);
    });
  }
  hideDropdownMenu() {
    this.setState({ displayMenu: false }, () => {
      document.removeEventListener("click", this.hideDropdownMenu);
    });
  }

  getCountriesList() {
    let { countryCodes, phone, selected } = this.state;
    axiosx
      .get(`/api/v4/user/countries`)
      .then((resp) => {
        this.setState({ countryCodes: resp.data.data });
        if (phone.length == resp.data.data[selected].mobileNumberFormat) {
          this.setState({ phone: phone, enableNextbtn: true });
        } else {
          this.setState({ phone: phone, enableNextbtn: false });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  onCountryCodeChange(e) {
    let { formData, errors, countryCodes, phone } = this.state;

    this.setState({
      selected: e.target.value,
      initialClick: false,
      isdcode: countryCodes[e.target.value].ISDCode,
      enableNextbtn:
        this.state.phone.length ==
        countryCodes[e.target.value].mobileNumberFormat
          ? true
          : false,
    });
    // mixpanel.track("Country_Code_Change", {
    //   countryCode: countryCodes[e.target.value].country,
    // });
    // if (!formData["countryCode"]) {
    //   errors[formData["countryCode"]] = "Required";
    //   this.setState({ errors: errors });
    // } else if (formData["countryCode"]) {
    //   errors["countryCode"] = "";
    //   this.setState({ errors: errors });
    // }
    this.hideDropdownMenu();
  }

  componentDidMount() {
    this.getCountriesList();
    var isError = JSON.parse(sessionStorage.getItem("isError"));
    isError && isError.error && sessionStorage.removeItem("isError");
  }

  onsubmit = (e) => {
    e.preventDefault();
    var appendedData = {};
    const { history, setData, currentUserStatus } = this.props;
    const { phone, isdcode, selected } = this.state;
    axios
      .get("https://geolocation-db.com/json/")
      .then((res) => {
        // console.log("IP ADDRESS FROM PhonePage.js:", res.data.IPv4);
        appendedData = {
          // firstName: currentUserStatus.firstName,
          email: "",
          mobileNumber: phone,
          countryCode: isdcode,
          deviceType: this.getDeviceType(),
          ip: res.data.IPv4,
        };

        this.setState({
          isSending: true,
          errorData: "",
        });

        if (appendedData) {
          localStorage.setItem(
            "mobileData",
            JSON.stringify({
              countryCode: isdcode,
              mobileNumber: phone,
            })
          );
          sessionStorage.setItem(
            "mobileData",
            JSON.stringify({
              countryCode: isdcode,
              mobileNumber: phone,
              selected: selected,
            })
          );
          setData("currentUserStatus", {
            ...appendedData,
          });
          mixpanel.track("Get_mobile_number", {
            mobile_number: phone,
            country_code: isdcode,
            deviceType: this.getDeviceType(),
            ip: res.data.IPv4,
          });
          if (isdcode == "+91") {
            api
              .post(endPoints.POST_SIGNUP_API, appendedData)
              .then((response) => {
                this.props.setData("mobileData", {
                  mobileNumber: appendedData.mobileNumber,
                  countryCode: appendedData.countryCode,
                });
                this.setState({
                  isSending: false,
                });
                history.push("/verify-otp");
              })
              .catch((error) => {
                let { errors } = this.state;
                console.log("error", error.response.data.error.message);
                if (
                  error.response &&
                  error.response.data &&
                  error.response.data.error
                ) {
                  if (error.response.data.statusCode == 400) {
                    this.setState({
                      errorData: error.response.data.error.message,
                      phone: "",
                    });
                  } else {
                    this.props.setData("globalMessage", {
                      type: "alert",
                      description: error.response.data.error.message,
                      showIcon: true,
                    });
                  }
                }

                this.setState({
                  isSending: false,
                });
              });
          } else {
            history.push("/getemail");
          }
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  onMobileNumberChange(e) {
    let { errors, countryCodes, selected } = this.state;

    if (e.target.value.length == countryCodes[selected].mobileNumberFormat) {
      this.setState({ phone: e.target.value, enableNextbtn: true });
    } else {
      this.setState({ phone: e.target.value, enableNextbtn: false });
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (this.state.displayMenu !== prevState.displayMenu) {
      if (this.state.displayMenu) {
        var myElement =
          document.getElementById(`country_sel_` + this.state.selected) &&
          document.getElementById(`country_sel_` + this.state.selected);
        var topPos = myElement && myElement.offsetTop;
        document.getElementById("country_cont") &&
          (document.getElementById("country_cont").scrollTop = topPos);
      }
    }
  }

  render() {
    const {
      phone,
      errorData,
      selected,
      countryCodes,
      displayMenu,
      enableNextbtn,
    } = this.state;
    // let enableNextbtn = phone.length == 10;
    return (
      <div>
        <BackButtonHeader />
        <div className="onboarding-layout">
          <div
            style={{
              paddingBottom: "50px",
              textAlign: "center",
            }}
          >
            <Fade>
              <img src={parentof} style={{ width: "190px" }} />
            </Fade>
          </div>
          <div
            style={{
              margin: "0px 25px 0 25px",
            }}
          >
            <Fade duration={500} delay={800}>
              <p className="heading-font-name">
                Welcome Onboard the World's First Live Upskilling Platform for
                Kids.
              </p>
            </Fade>
          </div>
          <div
            style={{
              margin: "60px 32px 0 32px",
              padding: "0 33px",
              width: "100%",
            }}
          >
            <form
              onSubmit={(e) => {
                this.onsubmit(e);
              }}
            >
              <Fade bottom duration={500} delay={1500}>
                <label className="label-font-name">
                  Enter your mobile number
                </label>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  {/* <input
                  type="number"
                  name="isdcode"
                  className="input-name"
                  value={this.state.isdcode}
                  onChange={(e) => this.setState({ isdcode: e.target.value })}
                  placeholder="00"
                  style={{
                    width: "60px",
                    marginRight: "15px",
                    textAlign: "center",
                  }}
                /> */}

                  <div
                    className="state-selection"
                    style={{
                      border: "1px solid rgba(0, 0, 0, 0.08)",
                      marginRight: "15px",
                      border: "none",
                      backgroundColor: "#f6f6f6",
                      borderRadius: "4px",
                      display: "flex",
                      position: "relative",
                    }}
                  >
                    <div
                      className="button"
                      style={{
                        display: "flex",
                        cursor: "pointer",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingLeft: "10px",
                      }}
                      onClick={(e) => this.showDropdownMenu(e)}
                    >
                      <div
                        style={{
                          fontWeight: selected === "" ? "400" : "bold",
                          color: "#333",
                          fontFamily: "Roboto",
                          fontSize: "15px",
                          lineHeight: "18px",
                        }}
                      >
                        {countryCodes.length > 0
                          ? countryCodes[selected].ISDCode
                          : ""}
                      </div>
                      <img
                        style={{
                          width: "10px",
                          height: "8px",
                          margin: "0 1rem",
                        }}
                        src={stateDropdown}
                      />
                    </div>
                    {displayMenu && (
                      <div
                        id="country_cont"
                        className=""
                        style={{
                          position: "absolute",
                          background: "#ffffff",
                          padding: "10px",
                          height: "200px",
                          overflowY: "overlay",
                          overflow: "overlay",
                          boxShadow: "0 0 10px rgba(0, 0, 0, 0.08)",
                          bottom: "45px",
                          width: "205px",
                        }}
                      >
                        <div style={{ height: "100%" }}>
                          {countryCodes.map((state, i) => {
                            return (
                              <div
                                id={"country_sel_" + i}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                }}
                                key={i}
                              >
                                <li
                                  style={{
                                    cursor: "pointer",
                                    wordBreak: "break-all",
                                    whiteSpace: "pre-wrap",
                                    width: "100%",
                                    margin: "10px 0",
                                    fontSize: "13px",
                                    fontWeight: selected === i ? "bold" : "400",
                                    lineHeight: "22px",
                                    color: "#43484B",
                                  }}
                                  onClick={this.onCountryCodeChange.bind(this)}
                                  value={i}
                                >
                                  {state.country}
                                </li>
                                {selected === i && (
                                  <img
                                    style={{
                                      marginLeft: "5px",
                                      marginBottom: "6px",
                                      height: "15px",
                                    }}
                                    src={tickicongreen}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="number"
                    name="phone"
                    className="input-name"
                    value={this.state.phone}
                    onChange={(e) => this.onMobileNumberChange(e)}
                    placeholder="000-000-0000"
                    style={{ maxWidth: "100%" }}
                  />
                </div>
              </Fade>
              {errorData && (
                <Fade bottom duration={500} delay={2000}>
                  <div
                    style={{
                      color: "red",
                      fontSize: "13px",
                      textAlign: "center",
                      marginTop: "10px",
                    }}
                  >
                    {errorData}
                  </div>
                </Fade>
              )}
              <Fade bottom duration={500} delay={2000}>
                <button
                  disabled={!enableNextbtn}
                  type="submit"
                  className="submit-name"
                  style={{
                    background: enableNextbtn ? "#0AC7E8" : "#CBCBC9",
                  }}
                >
                  Next
                </button>
              </Fade>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentUserStatus: state.currentUserStatus,
    globalError: state.globalError,
  };
}

export default withRouter(
  connect(
    mapStateToProps,
    { setData }
  )(PhonePage)
);
