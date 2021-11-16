import React, { Component, createRef } from "react";
import { connect } from "react-redux";
import { withRouter, Link } from "react-router-dom";
import { api, trackEvent, axiosx } from "../../../utils";
import { setData } from "../../../actions/actions";
import * as endPoints from "../../../js/constants";
import LogoMaiBreathing from "../../../images/Gifs/Logo Mai Breathing.gif";
import SplashHiIamMAI from "../../../images/Gifs/maisplash.gif";
import Fade from "react-reveal/Fade";
import BackButtonHeader from "../../common/CardList/v7.0/BackButtonHeader";
import parentof from "../../../images/Gifs/parentof.png";

const InputOtp1 = createRef();
const InputOtp2 = createRef();
const InputOtp3 = createRef();
const InputOtp4 = createRef();

const allRefs = [InputOtp1, InputOtp2, InputOtp3, InputOtp4];
let _isMounted = false;

class OtpPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      otp1: "",
      otp2: "",
      otp3: "",
      otp4: "",
      errorData: "",
      resend: false,
    };
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

  trackSuccessOTPVerification(data) {
    trackEvent("Verify_Button_Pressed", "SIGN_IN", "Onboarding", data, {}, {});
  }
  trackOnSuccess() {
    trackEvent("Profile_Submit_clicked", "Sign_UP", "OnBoarding", {}, {}, {});
  }

  onchange = (e) => {
    this.setState({
      [e.target.name]: e.target.value,
    });
    if (e.target.value != "") {
      if (e.target.value.length > 1) {
        const nextInput = parseInt(
          e.target.name.substr(e.target.name.length - 1)
        );
        for (let i = 0; i < e.target.value.length; i++) {
          const nxt = parseInt(nextInput) + i;
          const OTP = "otp" + nxt;
          const focusPos = parseInt(nxt) + 1;
          focusPos < 4 ? allRefs[focusPos].current.focus() : "";
          this.setState({
            [OTP]: e.target.value.charAt(i),
          });
        }
      } else {
        const nextInput = parseInt(
          e.target.name.substr(e.target.name.length - 1)
        );
        nextInput < 4 ? allRefs[nextInput].current.focus() : "";
      }
    }
  };

  onsubmit = (e) => {
    e.preventDefault();
    const { history } = this.props;
    this.handleConfirm();
  };

  componentDidMount() {
    InputOtp1.current.focus();
    _isMounted = true;
    this.resendTimer();
  }
  handleConfirm() {
    // evt.preventDefault();
    let {
      formData,
      errors,
      trackOnUpdate = false,
      login,
      otp1,
      otp2,
      otp3,
      otp4,
    } = this.state;

    let { token, history, currentUserStatus } = this.props;
    let postData = {
      countryCode: currentUserStatus.countryCode,
      mobileNumber: currentUserStatus.mobileNumber,
      otp: otp1 + otp2 + otp3 + otp4,
      email: currentUserStatus.email,
      deviceType: currentUserStatus.deviceType,
      ip: currentUserStatus.ip,
    };
    this.setState({
      errorData: "",
    });

    // this.resendTimer();
    // if (this.handleValidation()) {
    api
      .post(endPoints.POST_VERIFY_PHONE_OTP_API, postData)
      .then((response) => {
        var data = response.data.data;

        this.props.setData("currentUserStatus", data);
        var childDetails = data.children[0] ? data.children[0] : "";
        this.props.setData("currentChild", childDetails);
        this.props.setData("token", data.apiToken);
        this.setState({
          userData: data,
          otpVerified: true,
        });

        if (data) {
          var USER_ID = data._id;
          var USER_SIGNUP_DATE = data.createdAt;
          mixpanel.identify(USER_ID);
          mixpanel.people.set({
            $email: data.email, // only special properties need the $
            "Sign up date": USER_SIGNUP_DATE, // Send dates in ISO timestamp format (e.g. "2020-01-02T21:07:03Z")
            userid: USER_ID, // use human-readable names
            $phone: data.countryCode + data.mobileNumber,
            // $first_name: data.firstName,
            // $last_name: data.lastName || "",
            $country_code: data.countryCode,
            $user_type: "Mai",
            deviceType: this.getDeviceType(),
          });
          mixpanel.track("OTP Verification_Success");
          if (data.children.length > 2) {
            mixpanel.track("Parents_With_More_Than_Two_Children", {
              userid: USER_ID,
              username: data.firstName,
              mobilenumber: data.mobileNumber,
              country_code: data.countryCode,
            });
          }
          this.props.setData("justEntered", true);
          if (trackOnUpdate) {
            this.trackOnSuccess();
          } else {
            this.trackSuccessOTPVerification(data);
          }
        }
        if (data.isOnboarded === false) {
          history.push("/verify-profile");
          return;
        }
        history.push("/thanks");
        //   else {
        //     this.CheckInvitations(data.apiToken, data);
        //   }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          if (error.response.data.statusCode == 400) {
            this.setState({
              errorData: error.response.data.error.message,
              otp1: "",
              otp2: "",
              otp3: "",
              otp4: "",
            });
            // this.handleValidation();
          } else {
            this.props.setData("globalMessage", {
              type: "alert",
              description: error.response.data.error.message,
              showIcon: true,
            });
          }
        }
      });
    // }
  }
  resendTimer() {
    if (_isMounted) {
      this.setState({ resend: false, verify: true });
      setTimeout(() => {
        this.setState({ resend: true, verify: false });
      }, 30000);
    }
  }
  handleResend(evt) {
    evt.preventDefault();
    let { mobileData } = this.props;
    let { errors, resend } = this.state;
    if (!resend) {
      return;
    }
    this.resendTimer();
    // console.log('resend otp-=-=-=-=-=', mobileData);
    api
      .post(endPoints.POST_ADD_OR_SIGNIN_PHONE_NO_API, mobileData)
      .then((response) => {
        var data = response.data.data;
        if (data) {
          this.props.setData("message", "OTP was sent again");
          this.showMessage("OTP was sent again");
        }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.error
        ) {
          if (error.response.data.statusCode == 400) {
            errors["otp"] = error.response.data.error.message;
            this.handleValidation();
          } else {
            this.props.setData("globalMessage", {
              type: "alert",
              description: error.response.data.error.message,
              showIcon: true,
            });
          }
        }
      });
  }

  render() {
    const { otp1, otp2, otp3, otp4, errorData, resend } = this.state;
    let enableNextbtn =
      otp1.length == 1 &&
      otp2.length == 1 &&
      otp3.length == 1 &&
      otp4.length == 1;

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
            {/* <Fade duration={500} delay={800}>
              <p className="heading-font-name">
                Can you please verify the OTP sent to your phone number & email
                id?
              </p>
            </Fade> */}
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
                <label className="label-font-name">Enter OTP</label>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <input
                    type="number"
                    name="otp1"
                    className="input-name input-otp"
                    value={this.state.otp1}
                    ref={InputOtp1}
                    onChange={(e) => this.onchange(e)}
                    placeholder="0"
                  />
                  <input
                    type="number"
                    name="otp2"
                    className="input-name input-otp"
                    value={this.state.otp2}
                    ref={InputOtp2}
                    onChange={(e) => this.onchange(e)}
                    placeholder="0"
                  />
                  <input
                    type="number"
                    name="otp3"
                    className="input-name input-otp"
                    value={this.state.otp3}
                    ref={InputOtp3}
                    onChange={(e) => this.onchange(e)}
                    placeholder="0"
                  />
                  <input
                    type="number"
                    name="otp4"
                    className="input-name input-otp"
                    value={this.state.otp4}
                    ref={InputOtp4}
                    onChange={(e) => this.onchange(e)}
                    placeholder="0"
                  />
                </div>
              </Fade>
              <Fade bottom duration={500} delay={1500}>
                <p
                  className="heading-font-name"
                  style={{ marginTop: "42px", textAlign: "center" }}
                >
                  Did not recieve OTP?{" "}
                  <span
                    style={{
                      fontFamily: "Roboto",
                      cursor: resend ? "pointer" : "",
                      color: resend ? "rgb(10, 128, 232)" : "#4d4f4e",
                    }}
                    onClick={this.handleResend.bind(this)}
                  >
                    Resend
                  </span>
                </p>
              </Fade>
              {errorData && (
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
    mobileData: state.mobileData,
    registerData: state.registerData,
    currentUserStatus: state.currentUserStatus,
    globalError: state.globalError,
    hidePopup: state.hidePopup,
    token: state.token,
  };
}

export default withRouter(
  connect(
    mapStateToProps,
    { setData }
  )(OtpPage)
);
