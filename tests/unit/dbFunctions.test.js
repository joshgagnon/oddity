import chai from 'chai';
const should = chai.should();
const getDB = require('../../app/db').getDB;
const moment = require('moment');


describe('DB Functions', function() {
    let db;
    before(function (){
        db = getDB()
    });

    describe('company_from_nzbn_at_date', function() {
        it('should find the previous names of "CONSTELLATION HOLDINGS LIMITED"', function() {
            return db.func('company_from_nzbn_at_date', ['9429039824622', moment('06 July 1997', 'DD MMMM YYYY').toDate()])
                .then((result) => {
                    result[0].company_from_nzbn_at_date.should.equal('SSANGYONG MOTOR DISTRIBUTORS NZ LIMITED');
                });
        });

        it('should find the current name of "CONSTELLATION HOLDINGS LIMITE" on day of name change', function() {
            return db.func('company_from_nzbn_at_date', ['9429039824622', moment('26 May 1999', 'DD MMMM YYYY').toDate()])
                .then((result) => {
                    result[0].company_from_nzbn_at_date.should.equal('CONSTELLATION HOLDINGS LIMITED');
                });
        });
    });
    
    describe('nzbn_at_date', function() {
        it('should find nzbn for company name at date', function() {
            return db.func('nzbn_at_date', ['SATURN MOTORS LIMITED', moment('06 July 1992', 'DD MMMM YYYY').toDate()])
                .then((result) => {
                    result[0].nzbn_at_date.should.equal('9429039824622');
                });
        });

        it('should find nzbn for company name at date where date is the date of a name change', function() {
            return db.func('nzbn_at_date', ['SSANGYONG MOTOR DISTRIBUTORS NZ LIMITED', moment('05 July 1996', 'DD MMMM YYYY').toDate()])
                .then((result) => {
                    result[0].nzbn_at_date.should.equal('9429039824622');
                });
        });
    });
    
    describe('company_name_at_date', function() {
        it('should find company name at 06 July 1992 for given company name at 06 July 1997', function() {
            return db.func('company_name_at_date', ['SSANGYONG MOTOR DISTRIBUTORS NZ LIMITED', moment('06 July 1997', 'DD MMMM YYYY').toDate(),  moment('06 July 1992', 'DD MMMM YYYY').toDate()])
                .then((result) => {
                    result[0].company_name_at_date.should.equal('SATURN MOTORS LIMITED');
                });
        });

        it('should find company name at 06 July 1992 for given company name at date of a name change', function() {
            return db.func('company_name_at_date', ['CONSTELLATION HOLDINGS LIMITED', moment('26 May 1999', 'DD MMMM YYYY').toDate(),  moment('05 July 1996', 'DD MMMM YYYY').toDate()])
                .then((result) => {
                    result[0].company_name_at_date.should.equal('SSANGYONG MOTOR DISTRIBUTORS NZ LIMITED');
                });
        });
    });
    
    describe('company_name_history', function() {
        it('should find name history of CADBURY CONFECTIONERY LIMITED (10 March 2001)', function() {
            return db.func('company_name_history', ['CADBURY CONFECTIONERY LIMITED', moment('10 March 2001', 'DD MMMM YYYY').toDate()])
                .then(function(actualStates) {
                    const expectedStates = [{
                        nzbn: '9429000001748',
                        company_number: '204724',
                        company_name: 'MONDELEZ NEW ZEALAND',
                        start_date: '01 Jul 2013',
                        end_date: null
                    },{
                        nzbn: '9429000001748',
                        company_number: '204724',
                        company_name: 'CADBURY',
                        start_date: '05 Jan 2011',
                        end_date: '01 Jul 2013'
                    },{
                        nzbn: '9429000001748',
                        company_number: '204724',
                        company_name: 'CADBURY LIMITED',
                        start_date: '01 Apr 2009',
                        end_date: '05 Jan 2011'
                    },{
                        nzbn: '9429000001748',
                        company_number: '204724',
                        company_name: 'CADBURY CONFECTIONERY LIMITED',
                        start_date: '07 Sep 1990',
                        end_date: '01 Apr 2009'
                    },{
                        nzbn: '9429000001748',
                        company_number: '204724',
                        company_name: 'R. HUDSON LIMITED',
                        start_date: '05 Oct 1983',
                        end_date: '07 Sep 1990'
                    }];


                    actualStates.map(function(actualState, index) {
                        const expectedState = expectedStates[index];
                        actualState.nzbn.should.equal(expectedState.nzbn);
                        actualState.company_number.should.equal(expectedState.company_number);
                        actualState.company_name.should.equal(expectedState.company_name);
                        moment(actualState.start_date).isSame(moment(expectedState.start_date, 'DD MMM YYYY')).should.be.true;

                        if (expectedState.end_date === null) {
                            should.equal(null, actualState.end_date);
                        } else {
                            moment(actualState.end_date).isSame(moment(expectedState.end_date, 'DD MMM YYYY')).should.be.true;
                        }
                    });
                });
        });
    });
});
